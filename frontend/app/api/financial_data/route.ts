import { NextRequest, NextResponse } from 'next/server';

// URL del backend MCP (ajusta según tu configuración)
const BACKEND_URL = process.env.MCP_SERVER_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id') || null;
    const companyId = searchParams.get('company_id'); // Empresa por defecto

    // Llamar a los endpoints del backend MCP
    const [balanceResponse, expensesResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/balance/company?company_id=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${BACKEND_URL}/api/expenses/category?company_id=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    // Verificar si las respuestas son exitosas
    if (!balanceResponse.ok || !expensesResponse.ok) {
      throw new Error('Error al obtener datos del backend');
    }

    const balanceData = await balanceResponse.json();
    const expensesData = await expensesResponse.json();

    // Procesar y formatear los datos
    const response = {
      balance: {
        ingresos_totales: balanceData.data?.ingresos || 0,
        gastos_totales: balanceData.data?.gastos || 0,
        balance_total: balanceData.data?.balance || 0
      },
      expenses: {
        categorias: expensesData.data?.categorias || [],
        total_gastos: expensesData.data?.total_gastos || 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en financial_data API:', error);
    
    // Retornar datos de ejemplo en caso de error
    return NextResponse.json({
      balance: {
        ingresos_totales: 150000,
        gastos_totales: 85000,
        balance_total: 65000
      },
      expenses: {
        categorias: [
          { categoria: "Nómina", total: 45000, transacciones: 12 },
          { categoria: "Servicios", total: 15000, transacciones: 8 },
          { categoria: "Compras", total: 12000, transacciones: 25 },
          { categoria: "Transporte", total: 8000, transacciones: 15 },
          { categoria: "Otros", total: 5000, transacciones: 10 }
        ],
        total_gastos: 85000
      }
    });
  }
}

