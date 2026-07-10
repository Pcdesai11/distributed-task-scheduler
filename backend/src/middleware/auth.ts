import type { NextFunction, Request, Response } from 'express'

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_KEY
  if (!expected || expected === 'change-me-in-production') {
    next()
    return
  }

  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-api-key']
  if (token !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
