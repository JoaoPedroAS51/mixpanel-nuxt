import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(event => ({ title: `Loaded ${getQuery(event).page}` }))
