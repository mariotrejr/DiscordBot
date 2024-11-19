require('dotenv/config');
const { Client } = require('discord.js');
const schedule = require('node-schedule'); // Import scheduler
const { OpenAI } = require('openai');

// Discord client setup
const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent']
});

// Log when the bot is online
client.once('ready', () => {
    console.log('Bot is online');

    // Schedule the daily LeetCode reminder
    scheduleLeetCodeReminder();
});

const IGNORE_PREFIX = '!';
const CHANNELS = ['1307568312473092188', '1307564806194331698','1307564755132743680'];

// Initialize OpenAI with the correct API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY, // Ensure this key is correct
});



// Blind 75 questions in order
const blind75Questions = [
    "Contains Duplicate",
    "Valid Anagram",
    "Two Sum",
    "Group Anagrams",
    "Top K Frequent Elements",
    "Encode and Decode Strings",
    "Product of Array Except Self",
    "Longest Consecutive Sequence",
    "Valid Palindrome",
    "3Sum",
    "Container With Most Water",
    "Best Time to Buy And Sell Stock",
    "Longest Substring Without Repeating Characters",
    "Longest Repeating Character Replacement",
    "Minimum Window Substring",
    "Valid Parentheses",
    "Find Minimum In Rotated Sorted Array",
    "Search In Rotated Sorted Array",
    "Reverse Linked List",
    "Merge Two Sorted Lists",
    "Reorder List",
    "Remove Nth Node From End of List",
    "Linked List Cycle",
    "Merge K Sorted Lists",
    "Invert Binary Tree",
    "Maximum Depth of Binary Tree",
    "Same Tree",
    "Subtree of Another Tree",
    "Lowest Common Ancestor of a Binary Search Tree",
    "Binary Tree Level Order Traversal",
    "Validate Binary Search Tree",
    "Kth Smallest Element In a Bst",
    "Construct Binary Tree From Preorder And Inorder Traversal",
    "Binary Tree Maximum Path Sum",
    "Serialize And Deserialize Binary Tree",
    "Find Median From Data Stream",
    "Combination Sum",
    "Word Search",
    "Implement Trie Prefix Tree",
    "Design Add And Search Words Data Structure",
    "Word Search II",
    "Number of Islands",
    "Clone Graph",
    "Pacific Atlantic Water Flow",
    "Course Schedule",
    "Graph Valid Tree",
    "Number of Connected Components In An Undirected Graph",
    "Alien Dictionary",
    "Climbing Stairs",
    "House Robber",
    "House Robber II",
    "Longest Palindromic Substring",
    "Palindromic Substrings",
    "Decode Ways",
    "Coin Change",
    "Maximum Product Subarray",
    "Word Break",
    "Longest Increasing Subsequence",
    "Unique Paths",
    "Longest Common Subsequence",
    "Maximum Subarray",
    "Jump Game",
    "Insert Interval",
    "Merge Intervals",
    "Non Overlapping Intervals",
    "Meeting Rooms",
    "Meeting Rooms II",
    "Rotate Image",
    "Spiral Matrix",
    "Set Matrix Zeroes",
    "Number of 1 Bits",
    "Counting Bits",
    "Reverse Bits",
    "Missing Number",
    "Sum of Two Integers"
];

let currentQuestionIndex = 2;

// Function to schedule the daily reminder
function scheduleLeetCodeReminder() {
    schedule.scheduleJob('0 0 * * *', async () => { // Runs at 1:01 AM every day
        const channelId = CHANNELS[2]; // Use the first channel for reminders
        const channel = await client.channels.fetch(channelId);

        if (!channel) {
            console.error(`Channel with ID ${channelId} not found`);
            return;
        }

        // Get the current question
        const question = blind75Questions[currentQuestionIndex];
        currentQuestionIndex = (currentQuestionIndex + 1) % blind75Questions.length; // Cycle through questions

        // Send the reminder
        channel.send(`@everyone It's time for today's LeetCode question of the day: **${question}**. Let's solve it together! 💻`);
    });
}

// Message handling logic remains unchanged
client.on('messageCreate', async (message) => {
    console.log(`Message received: ${message.content}`);
    
    if (message.author.bot || message.author.id === client.user.id) return; // Ignore bot messages, including its own
    if (message.content.startsWith(IGNORE_PREFIX)) return; // Ignore messages with the prefix
    if (!CHANNELS.includes(message.channel.id)) return; // Ensure the bot is active only in specific channels
    if (!message.mentions.has(client.user)) return; // Only respond if bot is mentioned

    await message.channel.sendTyping(); // Indicate that the bot is typing

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping(); // Keep the bot typing
    }, 5000);

    let conversation = [];
    conversation.push({
        role: 'system',
        content: `You are a 23 year old named Sabino you are a computer engineer at UTRGV, acting like a real person. Your responses should be short and normal, Sabino is a chill guy who doesn't really care, is funny, and says dumb stuff. Be as realistic and human as possible, responding in the context of a real conversation. Do not reveal that you are a bot. Don't be cringe; talk normal.`
    });

    // Fetch previous messages for context (excluding the current message)
    let prevMessages = await message.channel.messages.fetch({ limit: 20 });
    prevMessages = prevMessages.filter((msg) => msg.id !== message.id);
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.bot || msg.author.id === client.user.id) return; // Ignore bot messages
        if (msg.content.startsWith(IGNORE_PREFIX)) return; // Ignore prefixed messages

        conversation.push({
            role: msg.author.id === client.user.id ? 'assistant' : 'user',
            name: username,
            content: msg.content
        });
    });

    // Add the current message to the conversation
    const username = message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
    conversation.push({
        role: 'user',
        name: username,
        content: message.content
    });

    try {
        // Generate response using OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Ensure the correct model
            messages: conversation,
        });

        const responseMessages = response.choices[0].message.content;

        const chunkSizeLimit = 2000;

        // Send response in chunks if necessary
        for (let i = 0; i < responseMessages.length; i += chunkSizeLimit) {
            const chunk = responseMessages.substring(i, i + chunkSizeLimit);
            console.log('Sending reply:', chunk); // Debugging
            await message.reply(chunk);
        }
    } catch (error) {
        console.error('OpenAI Error:', error);
        await message.reply('Sorry, I encountered an error while processing your request.');
    } finally {
        clearInterval(sendTypingInterval); // Clear the typing indicator interval
    }
});

// Log in to Discord using the token
client.login(process.env.TOKEN);
