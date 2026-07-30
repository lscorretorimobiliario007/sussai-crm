export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          height: 80,
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 60px",
        }}
      >
        <h2>TOP CONCEIÇÃO</h2>

        <nav style={{ display: "flex", gap: 30 }}>
          <a href="/" style={{ color: "#fff", textDecoration: "none" }}>Home</a>
          <a href="/comprar" style={{ color: "#fff", textDecoration: "none" }}>Comprar</a>
          <a href="/alugar" style={{ color: "#fff", textDecoration: "none" }}>Alugar</a>
          <a href="/login" style={{ color: "#fff", textDecoration: "none" }}>CRM</a>
        </nav>
      </header>

      <section
        style={{
          height: "650px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(rgba(15,23,42,.55), rgba(15,23,42,.55)), url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=80') center/cover",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: 56, marginBottom: 20 }}>
          Encontre o imóvel ideal
        </h1>

        <p style={{ fontSize: 22 }}>
          Comprar • Vender • Alugar
        </p>

        <button
          style={{
            marginTop: 40,
            padding: "18px 50px",
            border: 0,
            borderRadius: 10,
            background: "#2563eb",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          Buscar imóveis
        </button>
      </section>
    </div>
  );
}