export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { prisma } = await import('./lib/db');

    // Remove wrong records (eaId 186942 = Gündoğan, not Carvajal)
    await prisma.futCard.deleteMany({ where: { eaId: 186942 } });

    // Upsert Carvajal End of Era card with correct eaId
    await prisma.futCard.upsert({
      where: { eaId_cardType: { eaId: 204963, cardType: 'end_of_era' } },
      update: {
        name: 'Dani Carvajal',
        commonName: 'Carvajal',
        overall: 94,
        position: 'RB',
        altPositions: ['RWB'],
        pace: 85,
        shooting: 78,
        passing: 88,
        dribbling: 86,
        defending: 94,
        physical: 85,
        club: 'Real Madrid',
        league: 'LaLiga EA Sports',
        nation: 'España',
        promo: 'End of Era',
        promoOrder: 999999,
        cardImageId: null,
        imageUrl: null,
        skillMoves: 3,
        weakFoot: 3,
        foot: 'Right',
        height: 173,
        weight: 75,
        workRateAtk: 'Medium',
        workRateDef: 'High',
        releaseDate: new Date('2026-06-01'),
      },
      create: {
        eaId: 204963,
        name: 'Dani Carvajal',
        commonName: 'Carvajal',
        overall: 94,
        position: 'RB',
        altPositions: ['RWB'],
        pace: 85,
        shooting: 78,
        passing: 88,
        dribbling: 86,
        defending: 94,
        physical: 85,
        club: 'Real Madrid',
        league: 'LaLiga EA Sports',
        nation: 'España',
        cardType: 'end_of_era',
        promo: 'End of Era',
        promoOrder: 999999,
        cardImageId: null,
        imageUrl: null,
        skillMoves: 3,
        weakFoot: 3,
        foot: 'Right',
        height: 173,
        weight: 75,
        workRateAtk: 'Medium',
        workRateDef: 'High',
        releaseDate: new Date('2026-06-01'),
        source: 'manual',
      },
    });
  } catch (e) {
    console.error('[instrumentation] Carvajal seed error:', e);
  }
}
