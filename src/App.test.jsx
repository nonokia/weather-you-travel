import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />)
        // Adjust this expectation based on actual App content, 
        // but for now just checking if it renders is a good start.
        // If App has "Vite + React" text (default), we can check that.
        // Or just check if body has content.
        expect(document.body).toBeInTheDocument()
    })
})
