const QRCode = require('qrcode');

/**
 * Generate a scannable QR Code Data URL for ticket verification
 * @param {object} ticketData
 * @returns {Promise<string>} Data URL
 */
async function generateTicketQRCode(ticketData) {
  const payloadString = JSON.stringify({
    ref: ticketData.bookingReference,
    user: ticketData.userId,
    show: ticketData.showId,
    movie: ticketData.movieTitle,
    seats: ticketData.seatIds,
    issuedAt: new Date().toISOString(),
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrDataUrl;
  } catch (err) {
    console.error('[QR Service] Failed to generate QR code:', err.message);
    // Return fallback verification token if QR rendering fails
    return `IMOVIES:FALLBACK:REF=${ticketData.bookingReference}`;
  }
}

module.exports = {
  generateTicketQRCode,
};
