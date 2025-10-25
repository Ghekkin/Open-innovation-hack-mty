"""Input validation utilities."""
from datetime import datetime
from typing import Optional, Tuple


def validate_date(date_string: str, format: str = '%Y-%m-%d') -> Tuple[bool, Optional[datetime], Optional[str]]:
    """
    Validate a date string.
    
    Args:
        date_string: Date string to validate
        format: Expected date format
    
    Returns:
        Tuple of (is_valid, parsed_date, error_message)
    """
    try:
        parsed_date = datetime.strptime(date_string, format)
        return True, parsed_date, None
    except ValueError as e:
        return False, None, f"Formato de fecha inválido: {str(e)}"


def validate_amount(amount: any) -> Tuple[bool, Optional[float], Optional[str]]:
    """
    Validate a monetary amount.
    
    Args:
        amount: Amount to validate
    
    Returns:
        Tuple of (is_valid, parsed_amount, error_message)
    """
    try:
        parsed_amount = float(amount)
        if parsed_amount < 0:
            return False, None, "El monto no puede ser negativo"
        return True, parsed_amount, None
    except (ValueError, TypeError) as e:
        return False, None, f"Monto inválido: {str(e)}"

