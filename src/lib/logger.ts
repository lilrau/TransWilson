type LogLevel = 'info' | 'warn' | 'error'

interface LogData {
  message: string
  level: LogLevel
  service: string
  metadata?: Record<string, any>
}

export class Logger {
  private static async formatMessage(data: LogData) {
    const timestamp = new Date().toISOString()
    const metadataStr = data.metadata ? ` | metadata: ${JSON.stringify(data.metadata)}` : ''
    return `[${timestamp}] [${data.level.toUpperCase()}] [${data.service}] ${data.message}${metadataStr}`
  }

  static async info(service: string, message: string, metadata?: Record<string, any>) {
    'use server'
    const logData = { level: 'info' as LogLevel, service, message, metadata }
    const formattedMessage = await Logger.formatMessage(logData)
    console.log(formattedMessage)
  }

  static async warn(service: string, message: string, metadata?: Record<string, any>) {
    'use server'
    const logData = { level: 'warn' as LogLevel, service, message, metadata }
    const formattedMessage = await Logger.formatMessage(logData)
    console.warn(formattedMessage)
  }

  static async error(service: string, message: string, metadata?: Record<string, any>) {
    'use server'
    const logData = { level: 'error' as LogLevel, service, message, metadata }
    const formattedMessage = await Logger.formatMessage(logData)
    console.error(formattedMessage)
  }
}