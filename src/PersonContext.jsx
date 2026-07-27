import { createContext, useContext, useState } from 'react'

const PersonContext = createContext(null)

export function PersonProvider({ children }) {
  const [person, setPerson] = useState(() => localStorage.getItem('lastPerson') || '')

  const updatePerson = (name) => {
    setPerson(name)
    localStorage.setItem('lastPerson', name)
  }

  return (
    <PersonContext.Provider value={{ person, setPerson: updatePerson }}>
      {children}
    </PersonContext.Provider>
  )
}

export function usePerson() {
  return useContext(PersonContext)
}
