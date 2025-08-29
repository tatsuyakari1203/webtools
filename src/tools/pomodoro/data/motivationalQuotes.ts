// Motivational quotes and fun facts for Focus Mode
// These will be displayed randomly every 5 minutes for 10 seconds

export const motivationalQuotes = [
  // Motivational & Encouraging
  "You're doing amazing! Keep going! 🌟",
  "Every small step counts towards your goal! 🚀",
  "Focus is your superpower! Use it wisely! ⚡",
  "You're building something incredible right now! 🏗️",
  "Progress, not perfection! You've got this! 💪",
  "Your future self will thank you for this focus! 🙏",
  "Deep work = Deep results! Stay in the zone! 🎯",
  "You're training your brain like a muscle! 🧠💪",
  "Consistency beats intensity every time! 🔄",
  "You're in the flow state - ride the wave! 🌊",
  
  // Fun & Stress Relief
  "Time to breathe! Your brain needs oxygen too! 🫁",
  "Smile! It releases endorphins and boosts focus! 😊",
  "Stretch those shoulders! Your body will love you! 🤸‍♀️",
  "Remember: Progress over perfection always! ✨",
  "You're not just working, you're growing! 🌱",
  "Take a moment to appreciate how far you've come! 🎉",
  "Your brain is like a muscle - rest makes it stronger! 💤",
  "Hydrate! Your brain is 75% water! 💧",
  "You're doing better than you think you are! 🌈",
  "Every expert was once a beginner! Keep learning! 📚",
  
  // Random Fun Facts
  "Fun fact: Octopuses have 3 hearts! 🐙❤️",
  "Did you know? Honey never spoils! 🍯",
  "Bananas are berries, but strawberries aren't! 🍌🍓",
  "A group of flamingos is called a 'flamboyance'! 🦩",
  "Dolphins have names for each other! 🐬",
  "The human brain uses 20% of your body's energy! 🧠⚡",
  "There are more trees on Earth than stars in the galaxy! 🌳⭐",
  "A day on Venus is longer than its year! 🪐",
  "Wombat poop is cube-shaped! 🟫",
  "Sharks are older than trees! 🦈🌲",
  
  // Productivity Tips
  "Pro tip: The 2-minute rule - if it takes less than 2 minutes, do it now! ⏰",
  "Remember: Single-tasking beats multitasking! 🎯",
  "Your environment shapes your focus - optimize it! 🏠",
  "The best time to plant a tree was 20 years ago. The second best time is now! 🌳",
  "Small wins create big momentum! Celebrate them! 🎊",
  "Your attention is your most valuable resource! 💎",
  "Quality over quantity - always! ⭐",
  "The magic happens outside your comfort zone! 🪄",
  "Comparison is the thief of joy - focus on your journey! 🛤️",
  "Done is better than perfect! Ship it! 🚢",
  
  // Encouraging & Uplifting
  "You're exactly where you need to be right now! 🗺️",
  "Trust the process - great things take time! ⏳",
  "You're building habits that will change your life! 🔄",
  "Every moment of focus is an investment in yourself! 💰",
  "You're not behind - you're on your own timeline! 📅",
  "Challenges are just opportunities in disguise! 🎭",
  "You're stronger than you think you are! 💪",
  "This too shall pass - but your growth is permanent! 🌱",
  "You're writing your success story right now! ✍️",
  "Believe in yourself - you've overcome challenges before! 🏆"
];

// Function to get a random quote
export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};

// Function to check if it's time to show a quote (every 5 minutes)
export const shouldShowQuote = (startTime: number): boolean => {
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // Check if we're at a 5-minute interval (with 10-second window)
  const intervalsPassed = Math.floor(elapsed / fiveMinutes);
  const timeInCurrentInterval = elapsed % fiveMinutes;
  
  // Show quote for 10 seconds at the start of each 5-minute interval
  return timeInCurrentInterval < 10000 && intervalsPassed > 0;
};