import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'
import '../src/i18n'

describe('App', () => {
    it('renders the header and the flight search input', () => {
        render(<App />)
        // A heading should always render (the app title via i18n).
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
        // The primary call-to-action: searching by flight number.
        expect(screen.getByRole('button')).toBeInTheDocument()
    })
})
