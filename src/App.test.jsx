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
        localStorage.clear()
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

    it('fetches return flight and weather for destination when return flight is provided', async () => {
        const mockFlightData = {
            flightNumber: 'JL123',
            airline: 'Japan Airlines',
            departure: { airport: 'NRT', city: 'Tokyo', time: '10:00' },
            arrival: { airport: 'LAX', city: 'Los Angeles', time: '23:00' },
        }
        const mockWeatherData = [
            { date: '2025-11-29', temp: 22, condition: 'Sunny', icon: '☀️' },
        ]
        api.getFlightDetails
            .mockResolvedValueOnce(mockFlightData)
            .mockResolvedValueOnce({
                ...mockFlightData,
                flightNumber: 'NH456',
                departure: { airport: 'LAX', city: 'Los Angeles', time: '09:00' },
                arrival: { airport: 'NRT', city: 'Tokyo', time: '14:00' },
            })
        api.getWeather.mockResolvedValue(mockWeatherData)

        render(<App />)
        fireEvent.change(screen.getByLabelText(/departure flight/i), { target: { value: 'JL123' } })
        fireEvent.change(screen.getByLabelText(/return flight/i), { target: { value: 'NH456' } })
        fireEvent.click(screen.getByRole('button'))

        await waitFor(() => expect(api.getFlightDetails).toHaveBeenCalledTimes(2))
        expect(api.getFlightDetails).toHaveBeenCalledWith('JL123')
        expect(api.getFlightDetails).toHaveBeenCalledWith('NH456')
        expect(api.getWeather).toHaveBeenCalledWith('Los Angeles')
        expect(await screen.findByText(/Sunny/i)).toBeInTheDocument()
    })

    it('does not fetch weather when no return flight is given', async () => {
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
        expect(api.getFlightDetails).toHaveBeenCalledTimes(1)
        expect(api.getWeather).not.toHaveBeenCalled()
    })

    it('shows error message when flight lookup fails', async () => {
        api.getFlightDetails.mockRejectedValue(new Error('API error'))

        render(<App />)
        fireEvent.change(screen.getByLabelText(/departure flight/i), { target: { value: 'JL123' } })
        fireEvent.click(screen.getByRole('button'))

        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent(/flight not found/i)
    })
})
