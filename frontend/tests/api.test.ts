import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, apiErrorMessage } from '../src/api'

afterEach(() => vi.restoreAllMocks())

describe('api offline', () => {
  it('fails with an offline error instead of crashing', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const err = await api.getUser('anna').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('offline')
    expect(apiErrorMessage(err)).toMatch(/offline/i)
  })

  it('uses a generic message for other failures', () => {
    expect(apiErrorMessage(new Error('x'))).toMatch(/something went wrong/i)
  })
})
