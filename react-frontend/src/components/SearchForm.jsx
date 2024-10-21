import React from 'react'

const SearchForm = ({setSearchInput,searchInput,handleSubmit}) => {
  return (
    <form onSubmit={(e)=>handleSubmit(e)}>
        <input 
        type="text"
        placeholder='search here'
        value={searchInput}
        onChange={(e)=>setSearchInput(e.target.value)} />
        <button type="submit">Search</button>
    </form>
  )
}

export default SearchForm