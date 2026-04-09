-- ============================================
-- Seed Data: 30+ Prompts
-- ============================================

-- MOVE prompts (10)
INSERT INTO prompts (type, text) VALUES
('move', 'Everyone stand up and switch seats with someone from a different team.'),
('move', 'Do 5 jumping jacks as a team before answering.'),
('move', 'Point to the tallest person in the room. That person does a silly dance.'),
('move', 'Walk to the nearest window and describe what you see in 10 seconds.'),
('move', 'Everyone high-five someone from another team.'),
('move', 'Stand up and stretch for 10 seconds like you just woke up.'),
('move', 'Form a conga line with your team and walk around one table.'),
('move', 'Do your best robot walk to the other side of the room and back.'),
('move', 'Everyone point in the direction they think is North. Check who was right!'),
('move', 'Rock-paper-scissors tournament: each team member plays one round with the person next to them.');

-- TALK prompts (10)
INSERT INTO prompts (type, text) VALUES
('talk', 'Each team member shares one unpopular opinion they hold.'),
('talk', 'Describe your ideal weekend in exactly 3 words. Go around the team.'),
('talk', 'What is the most useless talent you have? Everyone shares.'),
('talk', 'If your team was a band, what would the band name be? Decide in 30 seconds.'),
('talk', 'Share one thing on your bucket list. Find something in common with a teammate.'),
('talk', 'Describe your job to a 5-year-old. Best explanation wins bragging rights.'),
('talk', 'What was your childhood dream job? Go around the team.'),
('talk', 'Two truths and a lie: one team member tells, others guess.'),
('talk', 'If you could have dinner with anyone, dead or alive, who would it be?'),
('talk', 'What is the best piece of advice you have ever received?');

-- CREATE prompts (10)
INSERT INTO prompts (type, text) VALUES
('create', 'Draw your team mascot on a napkin or paper in 60 seconds.'),
('create', 'Build the tallest tower you can using only items on the table. You have 30 seconds.'),
('create', 'Write a 4-line poem about your team. Read it aloud dramatically.'),
('create', 'Create a team handshake with at least 3 steps. Perform it for everyone.'),
('create', 'Design a logo for your team using only hand gestures. Present it.'),
('create', 'Invent a new holiday. Name it, describe how it is celebrated.'),
('create', 'Create a 15-second jingle for your team. Perform it together.'),
('create', 'Make up a new word and define it. Use it in a sentence.'),
('create', 'Sketch the person sitting across from you in 20 seconds. No peeking!'),
('create', 'Build a paper airplane and see whose flies the farthest.');

-- WILDCARD prompts (5 bonus)
INSERT INTO prompts (type, text) VALUES
('wildcard', 'The host picks any player. That player picks the next activity for ALL teams.'),
('wildcard', 'Swap one team member with another team for the next round.'),
('wildcard', 'Entire room: stand up, close your eyes, spin around once, sit down.'),
('wildcard', 'Every team must compliment another team sincerely. No repeats.'),
('wildcard', 'The youngest person on each team tells a 30-second story about their morning.');
