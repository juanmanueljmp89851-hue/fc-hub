/**
 * Seed initial editorial articles for AdSense approval.
 * These are original Modo Fosa guides and analysis.
 *
 * Usage: npx tsx scripts/seed-articles.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const articles = [
  {
    slug: "mejores-sbc-fc-27-septiembre-2026",
    title: "Los mejores SBC de EA FC 27 en septiembre 2026: cuáles completar y cuáles evitar",
    summary: "Analizamos los SBC activos de FC 27 este mes. Te contamos cuáles valen la pena por relación costo-recompensa y cuáles son una trampa de monedas.",
    category: "EA FC",
    tags: ["SBC", "FC 27", "guía"],
    content: `
<p>Cada semana EA lanza nuevos Squad Building Challenges, pero no todos valen la pena. En esta guía analizamos los SBC activos de septiembre 2026 para que no tires monedas al pedo.</p>

<h2>¿Qué mirar antes de completar un SBC?</h2>
<p>Antes de meter jugadores en un SBC, considerá estos factores:</p>
<ul>
  <li><strong>Relación costo vs. precio de mercado</strong>: si la carta que te dan vale menos que lo que gastás, no tiene sentido.</li>
  <li><strong>Links de química</strong>: una carta puede ser buena pero inútil si no linkea con tu equipo.</li>
  <li><strong>Fecha de vencimiento</strong>: algunos SBC son permanentes, otros vencen en días. Los que vencen rápido suelen tener mejores recompensas.</li>
  <li><strong>Jugadores intransferibles</strong>: los SBC te dan cartas que no podés vender. Pensalo bien.</li>
</ul>

<h2>SBC que recomendamos este mes</h2>
<p>Los SBC de íconos suelen ser los más rentables a largo plazo. Las cartas de leyenda mantienen su valor y son difíciles de conseguir por otro medio. Si tenés fodder acumulado, es buen momento para usarlo.</p>

<h2>SBC para evitar</h2>
<p>Los SBC de mejora de sobre rara vez dan algo bueno. La probabilidad de sacar una carta top es muy baja y terminás perdiendo monedas. Mejor vendé los jugadores en el mercado.</p>

<h2>Tip Modo Fosa</h2>
<p>Usá nuestra <a href="/sbc">sección de SBC</a> para ver el costo actualizado y las soluciones más baratas antes de completar cualquier desafío.</p>
`,
  },
  {
    slug: "guia-evoluciones-fc-27",
    title: "Guía de Evoluciones en FC 27: cómo funcionan y cuáles elegir",
    summary: "Todo lo que necesitás saber sobre el sistema de Evoluciones de EA FC 27. Cómo desbloquearlas, cuáles son las mejores y errores comunes que hay que evitar.",
    category: "EA FC",
    tags: ["evoluciones", "FC 27", "guía"],
    content: `
<p>Las Evoluciones son una de las mecánicas más importantes de FC 27. Permiten mejorar estadísticas de jugadores específicos completando objetivos en partidos. Acá te explicamos todo.</p>

<h2>¿Cómo funcionan las Evoluciones?</h2>
<p>EA libera evoluciones periódicamente. Cada una tiene requisitos de elegibilidad (overall máximo, liga, posición, etc.) y objetivos que tenés que cumplir jugando partidos (goles, asistencias, victorias).</p>
<p>Al completar todos los objetivos, la carta del jugador mejora permanentemente con stats más altos, nuevo estilo de carta y a veces posiciones alternativas.</p>

<h2>¿Cuáles conviene elegir?</h2>
<p>Las mejores evoluciones son las que:</p>
<ul>
  <li><strong>Suben stats clave</strong>: ritmo, tiro y regate son los más valiosos para delanteros</li>
  <li><strong>Agregan posiciones</strong>: un mediocampista que puede jugar de extremo gana mucha versatilidad</li>
  <li><strong>Aplican a cartas baratas</strong>: no tiene sentido evolucionar una carta de 200k cuando hay opciones más económicas</li>
</ul>

<h2>Errores comunes</h2>
<p>El error más grave es evolucionar un jugador que después no te entra en el equipo por química. Antes de empezar, armá la alineación mentalmente.</p>
<p>Otro error frecuente: no leer bien los objetivos. Algunos piden victorias en modos específicos (Rivals, Champions) y si jugás en el modo equivocado no cuenta.</p>

<h2>Seguí las evoluciones activas</h2>
<p>En nuestra <a href="/evoluciones">sección de Evoluciones</a> actualizamos todas las que están disponibles con sus requisitos y objetivos.</p>
`,
  },
  {
    slug: "como-ganar-monedas-fc-27",
    title: "Cómo ganar monedas en FC 27 sin gastar plata real: 7 métodos que funcionan",
    summary: "Métodos comprobados para generar monedas en EA FC 27 de forma gratuita. Desde tradeo básico hasta SBC y recompensas de Division Rivals.",
    category: "EA FC",
    tags: ["monedas", "FC 27", "guía", "tradeo"],
    content: `
<p>Conseguir monedas en FC 27 sin meter la tarjeta es posible, pero requiere constancia y estrategia. Acá van 7 métodos que realmente funcionan.</p>

<h2>1. Division Rivals: las recompensas semanales</h2>
<p>Jugar Rivals y ganar partidos te da recompensas semanales. Cuanto más alta tu división, mejores sobres recibís. No hace falta ganar todos — con 8 victorias por semana ya alcanzás las mejores recompensas de tu nivel.</p>

<h2>2. Squad Battles</h2>
<p>Para los que prefieren jugar contra la máquina, Squad Battles da recompensas decentes. Jugá al menos 15 partidos por semana en dificultad Profesional o más para maximizar puntos.</p>

<h2>3. Tradeo básico: comprar barato, vender caro</h2>
<p>El método más viejo del mundo pero sigue funcionando. Buscá cartas que se venden consistentemente y comprá cuando bajan (jueves/viernes) para vender cuando suben (lunes/martes antes de SBC).</p>

<h2>4. SBC con profit</h2>
<p>Algunos SBC dan sobres que valen más que lo que gastás completándolos. Los SBC de liga baratos son los mejores para esto. Revisá nuestra <a href="/sbc">sección de SBC</a> para ver costos actualizados.</p>

<h2>5. Objetivos y Hitos</h2>
<p>EA pone objetivos semanales que dan packs y monedas. Muchos son simples (meter goles con jugadores de X liga) y los podés completar mientras jugás normalmente.</p>

<h2>6. Vender todo lo que no usás</h2>
<p>Revisá tu club regularmente. Cartas de bronce y plata de ligas populares se venden por más de lo que pensás, especialmente cuando hay SBC de liga activos.</p>

<h2>7. Paciencia con las ventas</h2>
<p>No vendas una carta apenas la sacás de un sobre. Muchas veces los precios suben en los días siguientes cuando la oferta baja. Poné un precio razonable y esperá.</p>

<h2>Lo que NO funciona</h2>
<p>Evitá los métodos "milagrosos" que ves en YouTube. Los generadores de monedas no existen y los bots de autocompra te pueden banear la cuenta.</p>
`,
  },
  {
    slug: "armar-equipo-competitivo-fc-27",
    title: "Cómo armar un equipo competitivo en FC 27 con poco presupuesto",
    summary: "Guía para armar un squad competitivo en EA FC 27 gastando menos de 100k monedas. Formación, química y jugadores recomendados.",
    category: "EA FC",
    tags: ["equipo", "FC 27", "guía", "meta"],
    content: `
<p>No necesitás millones de monedas para competir en FC 27. Con estrategia y buenas elecciones podés armar un equipo que le pelee a cualquiera. Acá te mostramos cómo.</p>

<h2>Elegir la formación correcta</h2>
<p>La formación depende de tu estilo de juego, pero las más populares y efectivas en el meta actual son:</p>
<ul>
  <li><strong>4-2-3-1</strong>: equilibrada, buena para posesión y contraataque</li>
  <li><strong>4-1-2-1-2 (2)</strong>: agresiva con dos delanteros, ideal para presión alta</li>
  <li><strong>4-3-2-1</strong>: sólida en el medio, buena transición</li>
</ul>

<h2>Priorizar posiciones clave</h2>
<p>Si tenés pocas monedas, invertí primero en:</p>
<ol>
  <li><strong>Delantero centro</strong>: el que define los partidos. Buscá ritmo 85+ y tiro 80+</li>
  <li><strong>Mediocampista central defensivo</strong>: el que recupera la pelota. Defensa y físico altos</li>
  <li><strong>Laterales</strong>: ritmo es lo más importante, 85+ obligatorio</li>
</ol>

<h2>La química importa (mucho)</h2>
<p>Un equipo con 100 de química rinde notablemente mejor que uno con 80. Priorizá jugadores de la misma liga o nacionalidad para maximizar links.</p>

<h2>Jugadores "hidden gems"</h2>
<p>Cada año hay jugadores baratos que rinden como si fueran cartas top. Buscá en nuestra <a href="/jugadores">base de datos de cartas</a> filtrando por stats específicos — te vas a sorprender con lo que encontrás por menos de 5k monedas.</p>

<h2>Evoluciones gratuitas</h2>
<p>Las <a href="/evoluciones">Evoluciones</a> pueden convertir una carta mediocre en una bestia. Aprovechalas siempre que estén disponibles.</p>
`,
  },
  {
    slug: "futbol-argentino-fc-27-mejores-jugadores",
    title: "Los mejores jugadores del fútbol argentino en FC 27: top 20 cartas de la Liga Profesional",
    summary: "Ranking de las mejores cartas de jugadores de la Liga Profesional Argentina en EA FC 27. Overall, stats y precio actualizado.",
    category: "Fútbol Argentino",
    tags: ["Liga Profesional", "FC 27", "ranking", "Argentina"],
    content: `
<p>La Liga Profesional Argentina tiene representación en FC 27 con jugadores que sorprenden por sus stats. Desde los cracks de Boca y River hasta joyas ocultas de equipos chicos, acá repasamos las mejores cartas.</p>

<h2>¿Por qué usar jugadores argentinos?</h2>
<p>Más allá del patriotismo, los jugadores de la Liga Profesional tienen una ventaja clave: son baratos comparados con sus equivalentes europeos. Un mediocampista argentino con 82 de overall puede costar 3k cuando un similar de la Premier League vale 15k.</p>
<p>Además, linkean perfecto con la selección argentina (Messi, Di María, etc.) para equipos híbridos.</p>

<h2>Defensa</h2>
<p>Los centrales argentinos suelen tener buen físico y defensa, aunque les falta ritmo. Los laterales de Racing y River suelen ser las mejores opciones calidad-precio.</p>

<h2>Mediocampo</h2>
<p>Acá es donde la liga brilla. Mediocampistas técnicos con buen pase y regate que cuestan monedas. Ideales para formaciones de posesión.</p>

<h2>Ataque</h2>
<p>Delanteros rápidos con buen tiro — el clásico 9 argentino. Buscá jugadores con 4 estrellas de pierna mala como mínimo para ser competitivo online.</p>

<h2>Armate tu equipo argentino</h2>
<p>Explorá todas las cartas de la Liga Profesional en nuestra <a href="/jugadores">base de datos</a> y armá tu dream team argento.</p>
`,
  },
  {
    slug: "que-es-modo-fosa-comunidad-fc-argentina",
    title: "¿Qué es Modo Fosa? La comunidad argentina de EA FC que está creciendo",
    summary: "Modo Fosa es la plataforma comunitaria de EA FC para Argentina. Torneos, ranking, prode, cartas y más. Conocé todo lo que ofrece.",
    category: "Modo Fosa",
    tags: ["comunidad", "torneos", "ranking"],
    content: `
<p>Si jugás EA FC en Argentina, probablemente te hayas cruzado con Modo Fosa. Pero ¿qué es exactamente y por qué cada vez más jugadores se suman?</p>

<h2>Una plataforma hecha por jugadores para jugadores</h2>
<p>Modo Fosa nació de una necesidad simple: no había un lugar que centralizara todo lo que un jugador argentino de FC necesita. Torneos dispersos en Discord, rankings inexistentes, noticias en inglés. Modo Fosa junta todo en un solo lugar.</p>

<h2>Torneos organizados</h2>
<p>Cualquier usuario puede crear o participar en <a href="/torneos">torneos</a> con brackets automáticos, sistema de disputas y seguimiento de resultados. Desde copas casuales hasta competencias serias con premios.</p>

<h2>Sistema de ranking</h2>
<p>Cada partido que jugás en la plataforma suma puntos al <a href="/ranking">ranking global</a>. Es la forma de demostrar quién es el mejor de la comunidad, con datos reales y verificables.</p>

<h2>Prode deportivo</h2>
<p>¿Te gusta predecir resultados? El <a href="/prode">Prode</a> de Modo Fosa te permite competir contra amigos prediciendo partidos de fútbol real. Puntos por cada acierto, tabla de posiciones y premios.</p>

<h2>Base de datos de cartas</h2>
<p>Nuestra <a href="/jugadores">base de datos de cartas FC 27</a> se actualiza automáticamente con todas las promos, precios y stats. También tenemos <a href="/sbc">soluciones de SBC</a> y <a href="/evoluciones">evoluciones activas</a>.</p>

<h2>Gratis y abierto</h2>
<p>Modo Fosa es gratuito. Registrate, armá tu perfil y empezá a competir. La comunidad ya está adentro — ¿vos qué esperás?</p>
`,
  },
];

async function main() {
  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: article.category,
        tags: article.tags,
      },
      create: article,
    });
    console.log(`✅ ${article.slug}`);
  }
  console.log(`\n✅ ${articles.length} artículos guardados.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
