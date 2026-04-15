/**
 * Calculates trip fare based on business rules for Parvati Trading Co.
 */
export const calculateTripFare = (trip, carRates, settings) => {
  const openingKm = Number(trip.openingKm) || 0;
  const closingKm = Number(trip.closingKm) || 0;
  const rate = Number(trip.rate) || 0;
  const da = Number(trip.da) || 0;
  const nightCharges = Number(trip.nightCharges) || 0;
  const wholeNightCharges = Number(trip.wholeNightCharges) || 0;
  const toll = Number(trip.toll) || 0;
  const parking = Number(trip.parking) || 0;
  const extraCharges = Number(trip.extraCharges) || 0;
  const isHaltDay = trip.isHaltDay;

  const totalKm = Math.max(0, closingKm - openingKm);
  
  let billableKm = totalKm;
  const minKm = Number(settings.minKmPerDay) || 250;
  
  if (settings.applyMinKm && trip.tripType === 'Outstation' && !isHaltDay) {
    billableKm = Math.max(totalKm, minKm);
  }

  const baseFare = billableKm * rate;
  const tripTotal = baseFare + da + nightCharges + wholeNightCharges + toll + parking + extraCharges;

  return {
    totalKm,
    billableKm,
    baseFare,
    tripTotal
  };
};

/**
 * Higher level calculation for the entire record
 */
export const calculateGrandTotal = (trips) => {
  const subtotal = trips.reduce((sum, t) => sum + (Number(t.baseFare) || 0), 0);
  
  const totals = trips.reduce((acc, t) => {
    acc.da += Number(t.da || 0);
    acc.night += Number(t.nightCharges || 0);
    acc.wholeNight += Number(t.wholeNightCharges || 0);
    acc.toll += Number(t.toll || 0);
    acc.parking += Number(t.parking || 0);
    acc.extra += Number(t.extraCharges || 0);
    return acc;
  }, { da: 0, night: 0, wholeNight: 0, toll: 0, parking: 0, extra: 0 });

  const extraChargesTotal = totals.da + totals.night + totals.wholeNight + totals.toll + totals.parking + totals.extra;
  const grandTotal = subtotal + extraChargesTotal;
  
  return {
    subtotal,
    extraChargesTotal,
    grandTotal,
    breakdown: totals
  };
};

/**
 * Logic for Night Halt Rule Recommendation
 * "Night halt charges should apply only from the 2nd night onward"
 * "Only apply if vehicle is booked for more than 2 days"
 */
export const getHaltRecommendation = (tripsCount) => {
  if (tripsCount > 2) {
    return {
      eligible: true,
      message: "Eligible for night halt charges (from 2nd night onwards)"
    };
  }
  return {
    eligible: false,
    message: "Not eligible for automatic night halt rule (< 3 days)"
  };
};
