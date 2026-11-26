import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>AutoCheck</h1>
      <nav aria-label="Acceso público">
        <ul>
          <li><Link href="/login">Iniciar sesión</Link></li>
          <li><Link href="/registro">Registrarme</Link></li>
        </ul>
      </nav>
    </main>
  );
}
