import React, { Component } from 'react';
import axios from 'axios';
import firebase from '../firebase';
import EditableKeyPhrases from './KeyPhrase';

class Results extends Component {
  constructor() {
    super();
    this.state = {
      language: "",
      sentiment: "",
      keyPhrases: []
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userInput !== this.props.userInput) {
      this.getResponse();
    }
  }

  apiCalls = (endpoint, language) => {
    return axios({
      method: "POST",
      url: `https://canadacentral.api.cognitive.microsoft.com/text/analytics/v2.0/${endpoint}`,
      dataResponse: "json",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": `${process.env.REACT_APP_API_KEY}`
      },
      data: {
        documents: [
          {
            language: language,
            id: "1",
            text: this.props.userInput
          }
        ]
      }
    });
  };

  updateFirebase = () => {
    const results = {
      text: this.props.userInput,
      language: this.state.language,
      keyPhrases: this.state.keyPhrases,
      sentiment: this.state.sentiment
    }

    const dbRef = firebase.database().ref();

    dbRef.push(results);
  }

  getResponse = async () => {
    try {
      const getLanguage = await this.apiCalls("languages");

      const languageCode =
        getLanguage.data.documents[0].detectedLanguages[0].iso6391Name;

      let getResults = await Promise.all([
        this.apiCalls("keyPhrases", languageCode),
        this.apiCalls("sentiment", languageCode)
      ]);

      this.setState({
        language: getLanguage.data.documents[0].detectedLanguages[0].name,
        keyPhrases: getResults[0].data.documents[0].keyPhrases,
        sentiment: (getResults[1].data.documents[0].score * 100).toFixed(2)
      });

    } catch (error) {
      throw error;
    }
  };

  updateKeyPhrases = (newKeyPhrases, phraseIndex) => {
      
      let oldState = this.state.keyPhrases;

      let newState = [...oldState];

      for(let i=0; i < newState.length; i++) {
        if (i === phraseIndex) {
          newState[i] = newKeyPhrases;
        }
      }
    
      this.setState({
        keyPhrases: newState
      });
  };ß

  render() {
    return (
      <div className="results">
        <p className="results__language">
          You were typing in {this.state.language}
        </p>
        <ul className="results__keyPhrases">
          We found the following subjects in the text you entered:
          {this.state.keyPhrases.map((keyPhrase, i) => {
            return (
              <li key={i} className="results__keyPhrase">
                <EditableKeyPhrases
                  newKeyPhrases={this.updateKeyPhrases}
                  keyPhrases={keyPhrase}
                  phraseIndex={i}
                />
              </li>
            );
          })}
        </ul>
        <p className="results__sentiment">
          We think this is how you feel based on the text you entered :
          {this.state.sentiment}%
        </p>
        <button 
        type="submit"
        onClick={this.updateFirebase}>
        Log my thought</button>
      </div>
    );
  }
}

export default Results;

