import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import '../src/i18n'
import * as api from './services/api'

vi.mock('./services/api', () => ({
    getFlightDetails: vi.fn(),
    getWeather: vi.fn(),
}))

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the header and the flight search input', () => {
        render(<App />)
        // A heading should always render (the app title via i18n).
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
        // The primary call-to-action: searching by flight number.
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows validation error and does not call getFlightDetails for an invalid flight number', async () => {
        render(<App />)
        fireEvent.change(screen.getByLabelText(/departure flight/i), { target: { value: 'X' } })
        fireEvent.click(screen.getByRole('button'))
        expect(await screen.findByText(/valid flight number/i)).toBeInTheDocument()
        expect(api.getFlightDetails).not.toHaveBeenCalled()
    })

    it('calls getFlightDetails and shows no validation error for a valid flight number', async () => {
        api.getFlightDetails.mockResolvedValue({
            flightNumber: 'JL123',
            airline: 'Japan Airlines',
            departure: { airport: 'NRT', city: 'Tokyo', time: '10:00' },
            arrival: { airport: 'LAX', city: 'Los Angeles', time: '23:00' },
        })
        render(<App />)
        fireEvent.change(screen.getByLabelText(/departure flight/i), { target: { value: 'JL123' } })
        fireEvent.click(screen.getByRole('button'))
        await waitFor(() => expect(api.getFlightDetails).toHaveBeenCalledWith('JL123'))
        expect(screen.queryByText(/valid flight number/i)).not.toBeInTheDocument()
    })
})
