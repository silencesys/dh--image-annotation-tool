const getRandomNumber = (min = 0, max = 100000) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min))
}

export {
  getRandomNumber
}
