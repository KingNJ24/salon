module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API endpoint working correctly',
    timestamp: new Date().toISOString()
  });
}; 