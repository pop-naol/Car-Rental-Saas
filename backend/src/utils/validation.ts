// Input validation utilities

export class ValidationUtils {
  // Validate VIN format (17 characters, alphanumeric, no I, O, Q)
  static validateVIN(vin: string): boolean {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/
    return vinRegex.test(vin)
  }

  // Validate plate number format (varies by region, basic validation)
  static validatePlateNumber(plateNumber: string): boolean {
    // Allow alphanumeric with spaces and hyphens, 2-10 characters
    const plateRegex = /^[A-Z0-9\s-]{2,10}$/i
    return plateRegex.test(plateNumber)
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate phone number format (international format)
  static validatePhone(phone: string): boolean {
    // Allow digits, spaces, hyphens, parentheses, and + sign
    const phoneRegex = /^[\d\s\-\(\)\+]{10,20}$/
    return phoneRegex.test(phone)
  }

  // Validate date range (start must be before end)
  static validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate
  }

  // Validate non-negative number
  static validateNonNegative(value: number): boolean {
    return value >= 0
  }

  // Validate positive number
  static validatePositive(value: number): boolean {
    return value > 0
  }

  // Validate required field
  static validateRequired(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    return true
  }

  // Validate string length
  static validateLength(value: string, min: number, max: number): boolean {
    const length = value.trim().length
    return length >= min && length <= max
  }

  // Validate year (reasonable range for vehicles)
  static validateYear(year: number): boolean {
    const currentYear = new Date().getFullYear()
    return year >= 1900 && year <= currentYear + 1
  }

  // Validate percentage (0-100)
  static validatePercentage(value: number): boolean {
    return value >= 0 && value <= 100
  }

  // Validate rating (1-5)
  static validateRating(rating: number): boolean {
    return rating >= 1 && rating <= 5
  }

  // Validate UUID format
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Comprehensive validation for vehicle data
  static validateVehicleData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateRequired(data.vin)) {
      errors.push('VIN is required')
    } else if (!this.validateVIN(data.vin)) {
      errors.push('Invalid VIN format')
    }

    if (!this.validateRequired(data.plate_number)) {
      errors.push('Plate number is required')
    } else if (!this.validatePlateNumber(data.plate_number)) {
      errors.push('Invalid plate number format')
    }

    if (!this.validateRequired(data.brand)) {
      errors.push('Brand is required')
    }

    if (!this.validateRequired(data.model)) {
      errors.push('Model is required')
    }

    if (!this.validateRequired(data.year)) {
      errors.push('Year is required')
    } else if (!this.validateYear(data.year)) {
      errors.push('Invalid year')
    }

    if (data.daily_rate !== undefined && !this.validatePositive(data.daily_rate)) {
      errors.push('Daily rate must be positive')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Comprehensive validation for customer data
  static validateCustomerData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateRequired(data.email)) {
      errors.push('Email is required')
    } else if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format')
    }

    if (!this.validateRequired(data.first_name)) {
      errors.push('First name is required')
    }

    if (!this.validateRequired(data.last_name)) {
      errors.push('Last name is required')
    }

    if (!this.validateRequired(data.phone)) {
      errors.push('Phone is required')
    } else if (!this.validatePhone(data.phone)) {
      errors.push('Invalid phone format')
    }

    if (!this.validateRequired(data.license_number)) {
      errors.push('License number is required')
    }

    if (!this.validateRequired(data.license_expiry)) {
      errors.push('License expiry is required')
    } else {
      const expiryDate = new Date(data.license_expiry)
      if (expiryDate <= new Date()) {
        errors.push('License must not be expired')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
