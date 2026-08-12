"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="profile-page"><section className="profile-card"><h1>Algo saiu do esperado</h1><p>Seus dados continuam seguros. Tente carregar esta etapa novamente.</p><button className="button button-primary" onClick={reset}>Tentar novamente</button></section></main>; }
