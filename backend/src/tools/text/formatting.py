# src/tools/text/formatting.py

def format_currency(amount: float, currency_symbol: str = "$") -> str:
    """Formatea un número como una cadena de moneda, con comas y dos decimales."""
    return f"{currency_symbol}{amount:,.2f}"

def format_list(items: list, title: str = None) -> str:
    """Formatea una lista de strings en una lista con viñetas para una mejor lectura."""
    if not items:
        return ""
    
    bullet_points = "\n".join([f"  - {item}" for item in items])
    
    if title:
        return f"{title}:\n{bullet_points}"
    else:
        return bullet_points
