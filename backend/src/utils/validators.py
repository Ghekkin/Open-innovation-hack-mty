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

def parse_date(s: str) -> datetime:
    try:
        return datetime.strptime(s, '%Y-%m-%d')
    except Exception:
        raise ValueError('Formato de fecha inválido. Use YYYY-MM-DD')


def validate_entity_type(entity_type: str) -> None:
    if entity_type not in ('company', 'personal'):
        raise ValueError('entity_type debe ser "company" o "personal"')


def validate_pagination(limit: int, offset: int, max_limit: int = 200) -> tuple[int, int]:
    if limit < 1 or limit > max_limit:
        limit = min(max(limit, 1), max_limit)
    if offset < 0:
        offset = 0
    return limit, offset