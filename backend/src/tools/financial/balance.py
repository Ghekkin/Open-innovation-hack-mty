"""Balance checking tools for MCP server."""
import logging
from typing import Any, Dict, Optional
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def get_company_balance_tool(company_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get current financial balance for a company.
    
    This tool retrieves the total income, expenses, and net balance
    for a company from the database.
    
    Args:
        company_id: Optional company ID to filter results
    
    Returns:
        Dictionary with income, expenses, and balance information
    """
    try:
        queries = FinancialDataQueries()
        balance = queries.get_company_balance(company_id)
        
        return {
            'success': True,
            'data': balance,
            'message': f'Balance obtenido exitosamente' + (f' para empresa {company_id}' if company_id else '')
        }
        
    except Exception as e:
        logger.error(f"Error in get_company_balance_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener el balance de la empresa'
        }


def get_personal_balance_tool(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get current financial balance for personal finances.
    
    This tool retrieves the total income, expenses, and net balance
    for personal finances from the database.
    
    Args:
        user_id: Optional user ID to filter results
    
    Returns:
        Dictionary with income, expenses, and balance information
    """
    try:
        queries = FinancialDataQueries()
        balance = queries.get_personal_balance(user_id)
        
        return {
            'success': True,
            'data': balance,
            'message': f'Balance personal obtenido exitosamente' + (f' para usuario {user_id}' if user_id else '')
        }
        
    except Exception as e:
        logger.error(f"Error in get_personal_balance_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener el balance personal'
        }


def get_balance_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Universal balance tool that works for both companies and personal finances.
    
    Args:
        entity_type: Type of entity ('company' or 'personal')
        entity_id: Optional ID to filter results
    
    Returns:
        Dictionary with balance information
    """
    if entity_type.lower() == 'company':
        return get_company_balance_tool(entity_id)
    elif entity_type.lower() == 'personal':
        return get_personal_balance_tool(entity_id)
    else:
        return {
            'success': False,
            'error': f'Invalid entity_type: {entity_type}',
            'message': 'El tipo de entidad debe ser "company" o "personal"'
        }

