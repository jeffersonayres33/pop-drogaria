export default function CheckoutFailure() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="card p-12 text-center max-w-md">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="font-display text-2xl font-bold text-red-700 mb-3">Pagamento não aprovado</h1>
        <p className="text-gray-500 leading-relaxed">
          Houve um problema com seu pagamento. Por favor, tente novamente ou use outra forma de pagamento.
        </p>
        <a href="/catalogo" className="inline-block mt-6 btn-primary">Tentar novamente</a>
      </div>
    </div>
  )
}
