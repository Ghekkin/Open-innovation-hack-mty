import { NextRequest, NextResponse } from 'next/server';

// Cambia la URL y puerto según tu backend
const BACKEND_URL = 'http://localhost:8000';

export async function GET(request: NextRequest) {
  // Usar un company_id de ejemplo para pruebas
  const companyId = 'demo_company';
  try {
    // Obtener balance general de empresa
    const balanceRes = await fetch(`${BACKEND_URL}/api/get_company_balance?company_id=${companyId}`);
    const balance = await balanceRes.json();

    // Obtener gastos por categoría de empresa
    const expensesRes = await fetch(`${BACKEND_URL}/api/analyze_expenses_by_category?company_id=${companyId}`);
    const expenses = await expensesRes.json();

    return NextResponse.json({ balance, expenses });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos del backend', details: String(error) }, { status: 500 });
  }
}
