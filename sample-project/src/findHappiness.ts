const findHappiness = () => {
  const randomNum = Math.random();

  if (randomNum > 0.75) return 'Congrats! You did it!';

  return 'No happiness here. Better luck next time :(';
};

export default findHappiness;
