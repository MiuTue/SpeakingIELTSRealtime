export const part1Topics = [
  "Random Topic",
  "Work or study",
  "Hometown",
  "Daily routine",
  "Music",
  "Food",
  "Travel",
  "Technology",
  "Weather",
  "Reading",
  "Sports",
  "Hobby or leisure time",
  "Holidays",
  "Friends",
  "Family",
  "Pets or animals",
  "Transportation",
  "Shopping",
  "Home or decoration"
];

export const part2CueCards = [
  "Random Topic",
  "Describe a person who inspired you",
  "Describe a place you would like to visit",
  "Describe a book you enjoyed",
  "Describe a useful skill you learned",
  "Describe a memorable journey",
  "Describe a piece of technology you use often",
  "Describe a time you solved a difficult problem",
  "Describe an event that changed your life",
  "Describe a traditional festival in your country",
  "Describe an interesting wild animal you saw",
  "Describe a business leader you admire",
  "Describe a gift you received that was special",
  "Describe a beautiful city you visited"
];

export const part3Topics = [
  "Random Topic",
  "Education",
  "Society",
  "Technology",
  "Culture",
  "Environment",
  "Work",
  "Media",
  "Business and Career",
  "Festivals and Tourism",
  "Animals and Nature",
  "Family and Relationships",
  "Hobby and Health",
  "Shopping and Consumerism"
];

export const part2ToPart3Map: Record<string, string> = {
  "Describe a person who inspired you": "Society",
  "Describe a place you would like to visit": "Culture",
  "Describe a book you enjoyed": "Media",
  "Describe a useful skill you learned": "Education",
  "Describe a memorable journey": "Culture",
  "Describe a piece of technology you use often": "Technology",
  "Describe a time you solved a difficult problem": "Education",
  "Describe an event that changed your life": "Society",
  "Describe a traditional festival in your country": "Festivals and Tourism",
  "Describe an interesting wild animal you saw": "Animals and Nature",
  "Describe a business leader you admire": "Business and Career",
  "Describe a gift you received that was special": "Society",
  "Describe a beautiful city you visited": "Festivals and Tourism"
};

export const allTopics = {
  PART1: part1Topics,
  PART2: part2CueCards,
  PART3: part3Topics,
  FULL_TEST: ["Random Topics"],
  CUSTOM: ["Custom Topic"]
};

export function defaultTopicForMode(mode: keyof typeof allTopics) {
  return allTopics[mode][0] ?? "Work or study";
}
