import { defineNitroPlugin } from 'nitropack/runtime'
import { fixtureErrors } from '../utils/errors'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error) => {
    fixtureErrors.push(error.message)
  })
})
