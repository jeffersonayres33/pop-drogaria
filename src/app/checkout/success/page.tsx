// src/app/checkout/success/page.tsx
export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="card p-12 text-center max-w-md">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display text-2xl font-bold text-green-800 mb-3">Pagamento confirmado!</h1>
        <p className="text-gray-500 leading-relaxed">
          Seu pagamento foi aprovado. Em alguns instantes você receberá um e-mail com o link para acessar e gerar seus POPs personalizados.
        </p>
        <p className="text-sm text-gray-400 mt-4">Verifique também sua caixa de spam.</p>
      </div>
    </div>
  )
}
