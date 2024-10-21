import { useState } from 'react'
import './App.css'
import SearchForm from './components/SearchForm'
import axios from "axios"

function App() {
  const [searchInput, setSearchInput] = useState("")
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/search-tag/", {
        searchQuery: searchInput // Corrected key here
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
  
      if (response.data) {
        console.log(response.data);
      }
  
    } catch (error) {
      console.error("something went wrong", error);
    }
    setSearchInput("");
  };
  
  return (
    <>
      <h1>Search here</h1>
      <div className="card">
        <SearchForm 
        setSearchInput={setSearchInput} 
        searchInput={searchInput}
        handleSubmit={handleSubmit} />
        
      </div>
      
    </>
  )
}

export default App
