/* Suited practice — hand-authored content: personality statements, SJT scenarios,
   IB add-on scenarios, conditional-logic clause bank, syllogism nouns. */
window.Suited = window.Suited || {};

(function (S) {
  // ---------------------------------------------------------------------------
  // Section 4a — personality. 1 = "Not like me at all" … 5 = "Very much like me".
  // keyed: 1 means agreeing signals the trait; -1 means agreeing signals its absence.
  // pair: two statements measuring the same thing in different words (consistency check).
  // ---------------------------------------------------------------------------
  S.TRAITS = {
    conscientiousness: { label: 'Detail & conscientiousness', target: 90 },
    resilience: { label: 'Resilience under pressure', target: 85 },
    integrity: { label: 'Integrity', target: 95 },
    teamwork: { label: 'Teamwork', target: 80 },
    adaptability: { label: 'Adaptability', target: 80 },
    drive: { label: 'Drive & work ethic', target: 88 },
    leadership: { label: 'Assertiveness', target: 65 },
  };

  S.TRAIT_NOTES = {
    conscientiousness: 'Banks screen hard for this: models and decks have to be error-free. Score high, and answer consistently.',
    resilience: 'Long hours and deadlines that move without warning are normal. Show that you stay calm and productive.',
    integrity: 'Non-negotiable in a regulated industry. Anything that hints at cutting corners or bending rules is a red flag.',
    teamwork: 'Deal teams are small and depend on each other. Show that you collaborate, but can also work on your own.',
    adaptability: 'Priorities change hourly on live deals. Show that you are comfortable with change and ambiguity.',
    drive: 'Show initiative and ownership: you finish the job without being chased.',
    leadership: 'For junior roles, moderate is ideal: confident enough to speak up, but happy to take direction. Very high dominance can read as poor fit for an analyst seat.',
  };

  S.PERSONALITY = [
    // conscientiousness
    { id: 'p1', trait: 'conscientiousness', keyed: 1, pair: 'c-a', text: 'I double-check my work even when I am confident it is correct.' },
    { id: 'p2', trait: 'conscientiousness', keyed: -1, pair: 'c-a', text: 'Once I have finished a piece of work, I rarely go back over it.' },
    { id: 'p3', trait: 'conscientiousness', keyed: 1, text: 'I prefer to break complex projects into smaller parts and prioritise the critical sections first.' },
    { id: 'p4', trait: 'conscientiousness', keyed: 1, pair: 'c-b', text: 'Small errors in a document bother me until I fix them.' },
    { id: 'p5', trait: 'conscientiousness', keyed: -1, pair: 'c-b', text: 'A few typos are not worth worrying about if the overall message is right.' },
    { id: 'p6', trait: 'conscientiousness', keyed: 1, text: 'I keep a clear system for tracking my tasks and deadlines.' },
    // resilience
    { id: 'p7', trait: 'resilience', keyed: 1, pair: 'r-a', text: 'I stay calm and productive when a deadline moves up unexpectedly.' },
    { id: 'p8', trait: 'resilience', keyed: -1, pair: 'r-a', text: 'Sudden changes to a deadline tend to throw me off for the rest of the day.' },
    { id: 'p9', trait: 'resilience', keyed: 1, text: 'Critical feedback motivates me to improve rather than discouraging me.' },
    { id: 'p10', trait: 'resilience', keyed: -1, pair: 'r-b', text: 'I find it hard to let go of mistakes I have made.' },
    { id: 'p11', trait: 'resilience', keyed: 1, pair: 'r-b', text: 'After a setback, I move on quickly and focus on what to do next.' },
    { id: 'p12', trait: 'resilience', keyed: 1, text: 'I can keep performing well through several long days in a row.' },
    // integrity
    { id: 'p13', trait: 'integrity', keyed: 1, pair: 'i-a', text: 'I would report a mistake I made even if no one else was likely to notice it.' },
    { id: 'p14', trait: 'integrity', keyed: -1, pair: 'i-a', text: 'If an error is unlikely to be spotted, it is sometimes best to leave it alone.' },
    { id: 'p15', trait: 'integrity', keyed: 1, text: 'I follow procedures even when a shortcut would save time.' },
    { id: 'p16', trait: 'integrity', keyed: -1, pair: 'i-b', text: 'Rules are guidelines; experienced people know when to bend them.' },
    { id: 'p17', trait: 'integrity', keyed: 1, pair: 'i-b', text: 'I stick to the rules even when I think they are inconvenient.' },
    { id: 'p18', trait: 'integrity', keyed: 1, text: 'I am careful never to discuss confidential information outside work.' },
    // teamwork
    { id: 'p19', trait: 'teamwork', keyed: 1, pair: 't-a', text: 'I enjoy working towards a shared goal with other people.' },
    { id: 'p20', trait: 'teamwork', keyed: -1, pair: 't-a', text: 'I usually get better results when I work entirely on my own.' },
    { id: 'p21', trait: 'teamwork', keyed: 1, text: 'I offer to help teammates when I have spare capacity.' },
    { id: 'p22', trait: 'teamwork', keyed: 1, pair: 't-b', text: 'I actively seek out other people\'s views before finalising my work.' },
    { id: 'p23', trait: 'teamwork', keyed: -1, pair: 't-b', text: 'Asking others for input usually slows things down unnecessarily.' },
    { id: 'p24', trait: 'teamwork', keyed: 1, text: 'When there is tension in a team, I try to address it directly and constructively.' },
    // adaptability
    { id: 'p25', trait: 'adaptability', keyed: 1, pair: 'a-a', text: 'I am comfortable switching between tasks when priorities change.' },
    { id: 'p26', trait: 'adaptability', keyed: -1, pair: 'a-a', text: 'I get frustrated when I have to drop what I am doing for a new priority.' },
    { id: 'p27', trait: 'adaptability', keyed: 1, text: 'I can make progress even when instructions are incomplete.' },
    { id: 'p28', trait: 'adaptability', keyed: -1, pair: 'a-b', text: 'I prefer a predictable routine where each day looks much the same.' },
    { id: 'p29', trait: 'adaptability', keyed: 1, pair: 'a-b', text: 'I enjoy work where every day brings something different.' },
    { id: 'p30', trait: 'adaptability', keyed: 1, text: 'I pick up new tools and software quickly.' },
    // drive
    { id: 'p31', trait: 'drive', keyed: 1, pair: 'd-a', text: 'I take ownership of tasks and see them through to completion.' },
    { id: 'p32', trait: 'drive', keyed: -1, pair: 'd-a', text: 'I sometimes need reminders before I finish tasks that are not urgent.' },
    { id: 'p33', trait: 'drive', keyed: 1, text: 'I set myself goals that go beyond what is expected of me.' },
    { id: 'p34', trait: 'drive', keyed: 1, pair: 'd-b', text: 'I look for ways to add value beyond the task I have been given.' },
    { id: 'p35', trait: 'drive', keyed: -1, pair: 'd-b', text: 'I do what is asked of me and see little reason to do more.' },
    { id: 'p36', trait: 'drive', keyed: 1, text: 'I am willing to put in extra hours when a project needs it.' },
    // leadership / assertiveness
    { id: 'p37', trait: 'leadership', keyed: 1, pair: 'l-a', text: 'During discussions, I usually lead most of the conversation.' },
    { id: 'p38', trait: 'leadership', keyed: -1, pair: 'l-a', text: 'In group discussions, I tend to let others do most of the talking.' },
    { id: 'p39', trait: 'leadership', keyed: 1, text: 'I will voice a different opinion if I think the team is heading the wrong way.' },
    { id: 'p40', trait: 'leadership', keyed: 1, pair: 'l-b', text: 'I naturally take charge when a group lacks direction.' },
    { id: 'p41', trait: 'leadership', keyed: -1, pair: 'l-b', text: 'I prefer someone else to set the direction for a group.' },
    { id: 'p42', trait: 'leadership', keyed: 1, text: 'I am comfortable presenting my work to senior people.' },
  ];

  // ---------------------------------------------------------------------------
  // Section 4b — situational judgement. score: 2 best, 1 acceptable, -1 poor, -2 worst.
  // ---------------------------------------------------------------------------
  S.SJT = [
    {
      id: 'j1', scenario: 'A teammate disagrees with your approach to a pitch-book section, and it is causing visible tension in the team.',
      options: [
        { text: 'Arrange a short conversation to understand their perspective and look for a compromise.', score: 2, why: 'Direct, respectful and solution-focused: you resolve the conflict at the lowest level before it affects the deliverable.' },
        { text: 'Ask the associate to decide which approach the team should use.', score: 1, why: 'Reasonable if a quick conversation fails, but escalating first skips the step of trying to resolve it yourself.' },
        { text: 'Carry on with your approach, since you are confident it is right.', score: -1, why: 'Ignores the teammate and lets the tension build. Being confident does not replace alignment.' },
        { text: 'Avoid the teammate and communicate only by email until the pitch is done.', score: -2, why: 'Avoiding the conflict harms team dynamics and the quality of the work.' },
      ],
    },
    {
      id: 'j2', scenario: 'You notice that a colleague has accidentally put confidential client data in a document shared with a wide internal distribution list.',
      options: [
        { text: 'Tell your manager (or compliance) straight away and ask for immediate action to restrict access.', score: 2, why: 'Confidentiality breaches need prompt escalation through the proper channels. Speed limits the damage.' },
        { text: 'Message the colleague privately so that they can remove it themselves.', score: 1, why: 'Well intended and quick, but a breach may still need to be reported formally. Compliance needs to know.' },
        { text: 'Quietly edit the document to remove the data and say nothing.', score: -1, why: 'Fixing it silently leaves no record, and the data may already have been seen. Breaches must be reported.' },
        { text: 'Ignore it. It is an internal list, so there is no real risk.', score: -2, why: 'Internal exposure can still break information barriers and regulations. Ignoring it is never acceptable.' },
      ],
    },
    {
      id: 'j3', scenario: 'Your manager gives you a task in an area you have no experience of (for example, a restructuring analysis).',
      options: [
        { text: 'Accept it, research the topic yourself, and check the scope and your approach with your manager early on.', score: 2, why: 'Shows drive and willingness to learn, and early check-ins reduce the risk of wasted work.' },
        { text: 'Accept it and ask a more experienced analyst to show you how they would approach it.', score: 1, why: 'Good use of resources, but relying entirely on others shows less initiative than doing your own groundwork first.' },
        { text: 'Accept it and do your best without asking any questions, to avoid looking inexperienced.', score: -1, why: 'Pride over quality: without clarification you risk delivering the wrong thing.' },
        { text: 'Politely decline and suggest that someone with more experience takes it on.', score: -2, why: 'Turning down stretch work signals low drive, and junior bankers are expected to learn on the job.' },
      ],
    },
    {
      id: 'j4', scenario: 'A client is hesitant to go ahead with a transaction because of recent market volatility.',
      options: [
        { text: 'Provide recent market data, comparable transactions and a clear risk assessment so that they can decide on an informed basis.', score: 2, why: 'Client-first and data-driven: you address the concern with evidence rather than pressure.' },
        { text: 'Suggest a follow-up call with the senior banker to talk through their concerns.', score: 1, why: 'Sensible escalation, but it adds nothing yourself. Pair it with supporting data.' },
        { text: 'Reassure them that markets always recover and that the timing is fine.', score: -1, why: 'Empty reassurance with no evidence can damage credibility and trust.' },
        { text: 'Stress that delaying could mean losing the deal entirely, to create urgency.', score: -2, why: 'Pressure tactics damage the relationship and may breach duty-of-care norms.' },
      ],
    },
    {
      id: 'j5', scenario: 'At 11pm your MD emails asking for a turn of the model by 8am. You are also due to deliver comments on another deal\'s deck by 9am.',
      options: [
        { text: 'Estimate how long each task will take and, if both cannot be done well, tell the relevant associates now so that priorities can be set.', score: 2, why: 'Being open about capacity early lets the team re-prioritise. Surprises at 8am are the worst outcome.' },
        { text: 'Work through the night to finish both, and flag any risks in the morning.', score: 1, why: 'Shows commitment, but raising the conflict at 8am is too late if quality slips.' },
        { text: 'Do the MD\'s request first, since seniority decides, and send the deck comments whenever you can.', score: -1, why: 'Seniority is not the only factor. Missing another team\'s deadline without warning them damages trust.' },
        { text: 'Reply to the MD that you are already busy and cannot do it.', score: -2, why: 'A flat refusal without offering options looks unhelpful and shows poor ownership.' },
      ],
    },
    {
      id: 'j6', scenario: 'While reviewing a deck that has already gone to the client, you find an error in a valuation multiple.',
      options: [
        { text: 'Tell your associate straight away, explain the impact, and propose a corrected page.', score: 2, why: 'Takes ownership, is transparent, and brings a solution. Integrity and detail orientation together.' },
        { text: 'Correct it in the working file so that the next version is right.', score: -1, why: 'The client already has the wrong number, so silently fixing it for later leaves the client misinformed.' },
        { text: 'Tell your associate about the error and ask what they want to do.', score: 1, why: 'Honest and prompt, but arriving with a proposed fix is better.' },
        { text: 'Leave it. The difference is small and pointing it out would embarrass the team.', score: -2, why: 'Hiding errors is an integrity failure, and small errors can matter a lot to a client.' },
      ],
    },
    {
      id: 'j7', scenario: 'During a pitch, a teammate is consistently missing internal deadlines, which puts pressure on your part of the work.',
      options: [
        { text: 'Speak to them privately, ask whether something is blocking them, and offer help or agree interim deadlines.', score: 2, why: 'Tackles the problem directly and supportively, and protects the deliverable.' },
        { text: 'Raise it with the associate running the pitch.', score: 1, why: 'Appropriate if a direct conversation fails, but going to the associate first can feel like going behind their back.' },
        { text: 'Quietly do their share of the work so that the pitch is not affected.', score: -1, why: 'It protects the pitch in the short term, but hides the problem and burns you out.' },
        { text: 'Complain about them to other analysts.', score: -2, why: 'Gossip damages the team\'s culture and solves nothing.' },
      ],
    },
    {
      id: 'j8', scenario: 'A friend at a hedge fund asks, casually, whether your bank is working on anything in the tech sector.',
      options: [
        { text: 'Politely decline to discuss work matters, and change the subject.', score: 2, why: 'Protects confidential and possibly price-sensitive information without being awkward.' },
        { text: 'Decline, and report the conversation to compliance if it seemed like a deliberate probe.', score: 2, why: 'Also excellent: reporting suspicious approaches is exactly what compliance expects.' },
        { text: 'Give a vague answer, such as "things are busy in tech", without naming anything specific.', score: -1, why: 'Even vague hints can be material information. Say nothing.' },
        { text: 'Share general information, since you trust your friend.', score: -2, why: 'This could amount to leaking inside information, a serious regulatory breach.' },
      ],
    },
    {
      id: 'j9', scenario: 'You are given a task with unclear instructions and your associate is in back-to-back meetings all day.',
      options: [
        { text: 'Write down your interpretation and planned approach, send a short email to confirm it, and start on the parts that are clear.', score: 2, why: 'Moves forward, surfaces assumptions, and makes it easy for a busy associate to correct your course.' },
        { text: 'Ask another analyst who has done similar work how they would read the request.', score: 1, why: 'Useful context, but still confirm with the person who set the task.' },
        { text: 'Wait until the associate is free before starting.', score: -1, why: 'Wastes a day. Junior bankers are expected to make progress under ambiguity.' },
        { text: 'Guess what they want and deliver it without checking.', score: -2, why: 'You risk wasted work, and missed expectations are hard to recover from.' },
      ],
    },
    {
      id: 'j10', scenario: 'A senior colleague asks you to change a number in a model so that the output "looks better" for a client presentation, without a clear reason.',
      options: [
        { text: 'Ask what the reason for the change is, and raise it with your manager or compliance if it cannot be justified.', score: 2, why: 'Respectful but firm: every number must be defensible. Escalate if it is not.' },
        { text: 'Make the change but keep a note of the original figure.', score: -1, why: 'Keeping a record does not make a misleading change acceptable.' },
        { text: 'Refuse outright and tell the team that the colleague is being unethical.', score: -1, why: 'The instinct is right, but going public before understanding the request is poor judgement.' },
        { text: 'Make the change. They are senior and know what they are doing.', score: -2, why: 'Following an instruction does not excuse misrepresenting data to a client.' },
      ],
    },
    {
      id: 'j11', scenario: 'You have finished your work early on a quiet afternoon.',
      options: [
        { text: 'Tell your staffer or associates that you have capacity, and offer to help on live deals.', score: 2, why: 'Proactive and visible: it builds trust and experience.' },
        { text: 'Use the time to improve your modelling skills or read up on your sector.', score: 1, why: 'Good self-development, but letting the team know you have capacity comes first.' },
        { text: 'Leave early, since your work is done.', score: -1, why: 'Occasionally fine, but it misses a chance to show drive, and work often arrives late.' },
        { text: 'Look busy so that nobody gives you more work.', score: -2, why: 'Dishonest and damaging to your reputation when people notice.' },
      ],
    },
    {
      id: 'j12', scenario: 'A client emails you directly asking for a document that your MD has said should not be shared yet.',
      options: [
        { text: 'Acknowledge the email politely, say you will come back to them shortly, and check with your MD before responding.', score: 2, why: 'Responsive to the client, but defers to the deal lead on a sensitive decision.' },
        { text: 'Forward the email to your MD and let them handle it.', score: 1, why: 'Correct escalation, but the client is left without an acknowledgement.' },
        { text: 'Send the document. The client is paying, so they should get what they ask for.', score: -2, why: 'Overrides a direct instruction and may harm the negotiation strategy.' },
        { text: 'Ignore the email until your MD raises it.', score: -1, why: 'Leaving a client unanswered is unprofessional.' },
      ],
    },
    {
      id: 'j13', scenario: 'In a team meeting, your associate presents a figure that you are fairly sure is out of date.',
      options: [
        { text: 'Mention it tactfully in the meeting ("I think that may have been updated. I can check.") or straight after, depending on the setting.', score: 2, why: 'Accuracy matters and this protects the team, handled in a way that respects your associate.' },
        { text: 'Check the number after the meeting and send your associate a private note.', score: 1, why: 'Respectful, but if decisions are being made on the figure right now, waiting has a cost.' },
        { text: 'Say nothing. It is not your place to correct a senior colleague.', score: -2, why: 'Staying silent lets an error spread. Good teams want juniors to flag issues.' },
        { text: 'Interrupt firmly to correct the number in front of everyone.', score: -1, why: 'Right intention, poor delivery. It can undermine your associate unnecessarily.' },
      ],
    },
    {
      id: 'j14', scenario: 'You realise you will miss a deadline you committed to for tomorrow morning because a data provider was down for most of the day.',
      options: [
        { text: 'Let your associate know now, explain the cause, and propose a revised time or a partial deliverable.', score: 2, why: 'Early warning plus options is exactly what managers want.' },
        { text: 'Work through the night to try to hit the deadline anyway, without mentioning the risk.', score: -1, why: 'Admirable effort, but if you still miss the deadline the surprise is worse.' },
        { text: 'Send what you have at the deadline and explain then.', score: 1, why: 'At least you are transparent, but flagging it earlier would have let the team plan.' },
        { text: 'Miss the deadline and explain only if asked.', score: -2, why: 'Poor ownership and communication.' },
      ],
    },
    {
      id: 'j15', scenario: 'A new analyst on your team is struggling with Excel shortcuts and keeps asking you for help while you are busy.',
      options: [
        { text: 'Agree a set time to sit with them and share some resources so they can learn on their own.', score: 2, why: 'Supports a teammate while protecting your own deliverables.' },
        { text: 'Help them each time they ask, even if it delays your work.', score: 1, why: 'Kind and team-oriented, but not sustainable, and your own deadlines matter too.' },
        { text: 'Tell them to figure it out themselves.', score: -2, why: 'Unsupportive and bad for team culture.' },
        { text: 'Ask your associate to find someone else to train them.', score: -1, why: 'Passing it upwards when a simple fix is available shows little teamwork.' },
      ],
    },
    {
      id: 'j16', scenario: 'Your team is split on whether to include an aggressive set of assumptions in a client\'s valuation range.',
      options: [
        { text: 'Suggest presenting a base case alongside sensitivity cases, so that the client sees the range and what drives it.', score: 2, why: 'Data-driven and transparent. You turn a disagreement into better analysis.' },
        { text: 'Back whichever view the most senior person holds.', score: -1, why: 'Deferring on analysis without adding a view shows little judgement.' },
        { text: 'Share your view with supporting evidence, and then go with the team\'s decision.', score: 1, why: 'Good contribution, although suggesting a way to reconcile the views is even better.' },
        { text: 'Push the aggressive case, because higher numbers help win the mandate.', score: -2, why: 'Inflating a valuation to win business risks misleading the client.' },
      ],
    },
    {
      id: 'j17', scenario: 'You are on holiday and receive an urgent message about a live deal you worked on.',
      options: [
        { text: 'Reply briefly to confirm who is covering, and point them to the files and notes they need.', score: 2, why: 'Responsible without derailing your break. A good handover plan should make this quick.' },
        { text: 'Log on and handle it yourself even though someone else is covering.', score: 1, why: 'Committed, but it can undermine the cover arrangements and burn you out.' },
        { text: 'Ignore it. You are on holiday.', score: -2, why: 'On a live deal, a short reply to hand things over properly is expected.' },
        { text: 'Reply that you will look at it when you are back next week.', score: -1, why: 'Urgent deal matters cannot wait a week, so at least redirect them.' },
      ],
    },
    {
      id: 'j18', scenario: 'You receive critical feedback from your associate that your last model was poorly structured.',
      options: [
        { text: 'Thank them, ask for specific examples, and apply the changes to your next model.', score: 2, why: 'Resilient and growth-oriented. Specifics turn feedback into improvement.' },
        { text: 'Accept the feedback and fix the current model.', score: 1, why: 'Good, but asking what "well structured" means to them helps you avoid repeating it.' },
        { text: 'Explain why you structured it that way and defend your choices.', score: -1, why: 'Some context is fine, but being defensive makes you look hard to coach.' },
        { text: 'Take it personally and avoid that associate on future work.', score: -2, why: 'Poor resilience, and it limits your development.' },
      ],
    },
    {
      id: 'j19', scenario: 'Two associates give you urgent tasks with the same deadline, and each insists theirs comes first.',
      options: [
        { text: 'Tell both of them about the clash and ask them (or the staffer) to agree the priority, proposing a realistic plan.', score: 2, why: 'Surfaces the conflict to the people who can resolve it, with a plan attached.' },
        { text: 'Prioritise based on which deal is more advanced or closer to signing, and tell both associates.', score: 1, why: 'Reasonable judgement, but deciding alone risks upsetting a senior colleague.' },
        { text: 'Try to do both at once and hope they are both acceptable.', score: -1, why: 'Likely lowers the quality of both tasks.' },
        { text: 'Do whichever task you prefer.', score: -2, why: 'Arbitrary and unprofessional.' },
      ],
    },
    {
      id: 'j20', scenario: 'You find out that a teammate has been rounding hours up on their timesheet.',
      options: [
        { text: 'Raise it with them privately first, and escalate through the proper channel if it continues.', score: 2, why: 'Balances integrity with fairness. Give them the chance to correct it, then escalate.' },
        { text: 'Report it to your manager straight away.', score: 1, why: 'A defensible choice for an integrity issue, although a private word first is often more proportionate.' },
        { text: 'Ignore it. Everyone does it.', score: -2, why: '"Everyone does it" normalises dishonesty.' },
        { text: 'Start doing the same so that you are not at a disadvantage.', score: -2, why: 'An integrity failure on your part.' },
      ],
    },
    {
      id: 'j21', scenario: 'A client asks you a technical question on a call that you do not know the answer to.',
      options: [
        { text: 'Say you want to give them an accurate answer and will follow up shortly, then confirm the answer with your team.', score: 2, why: 'Honest and professional. Accuracy beats guessing.' },
        { text: 'Hand the question to the senior banker on the call.', score: 1, why: 'Appropriate on a live call, and you should still follow up.' },
        { text: 'Give your best guess confidently so that you look knowledgeable.', score: -2, why: 'Wrong information given to a client is far worse than a short delay.' },
        { text: 'Say nothing and hope someone else answers.', score: -1, why: 'Passive, and it leaves the client unanswered.' },
      ],
    },
    {
      id: 'j22', scenario: 'Your team\'s working process for pulling comparables is slow and error-prone. You think you know a better way.',
      options: [
        { text: 'Build a quick prototype of the improvement, show it to your associate, and suggest trying it on the next deal.', score: 2, why: 'Initiative backed by evidence, introduced with low risk.' },
        { text: 'Suggest the idea in the next team meeting.', score: 1, why: 'Good initiative. A working example would make it more persuasive.' },
        { text: 'Switch to your method straight away without telling anyone.', score: -1, why: 'Unilateral changes can confuse the team and introduce inconsistencies.' },
        { text: 'Keep quiet. The current process is how things are done.', score: -2, why: 'Misses a chance to add value.' },
      ],
    },
    {
      id: 'j23', scenario: 'You are asked to prepare a first draft of a CIM section in a sector you know little about, due in two days.',
      options: [
        { text: 'Review past CIMs and research reports on the sector, draft an outline, and check it with your associate before writing the whole thing.', score: 2, why: 'Efficient, resourceful, and reduces rework.' },
        { text: 'Write the full draft first, then ask for feedback.', score: 1, why: 'Delivers on time, but if the direction is wrong you waste time.' },
        { text: 'Ask for the deadline to be extended because the sector is new to you.', score: -1, why: 'Premature. Try to deliver first and raise problems only if they are real.' },
        { text: 'Copy a previous CIM section with minimal edits.', score: -2, why: 'Low quality, and it risks factual errors that do not apply to this client.' },
      ],
    },
    {
      id: 'j24', scenario: 'Late at night, a colleague on your deal team seems visibly overwhelmed and stressed.',
      options: [
        { text: 'Check in privately, offer to take something off their plate if you can, and suggest they speak to the associate about their workload.', score: 2, why: 'Supportive teamwork without overcommitting yourself.' },
        { text: 'Tell the associate that the colleague seems to be struggling.', score: 1, why: 'Can help, but talking to the colleague first respects their autonomy.' },
        { text: 'Leave them alone. Everyone is stressed.', score: -1, why: 'Misses a simple chance to support the team.' },
        { text: 'Take on all of their work without telling anyone.', score: -1, why: 'Well meant, but unsustainable and invisible to the people managing staffing.' },
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // Section 5 — IB-specific judgement add-on (supplementary).
  // ---------------------------------------------------------------------------
  S.IB = [
    {
      id: 'b1', scenario: 'You accidentally overhear two MDs discussing an unannounced acquisition by a listed company you hold shares in personally.',
      options: [
        { text: 'Do not trade, do not discuss it, and check the firm\'s personal-trading policy or ask compliance whether you need to report anything.', score: 2, why: 'You now hold material non-public information. Trading on it would be insider dealing.' },
        { text: 'Do not trade, and keep it to yourself.', score: 1, why: 'Correct behaviour, but you may also have a duty to disclose your holding.' },
        { text: 'Sell your shares now, before you are put on the deal.', score: -2, why: 'Trading while in possession of MNPI is illegal, whether you are on the deal or not.' },
        { text: 'Tell a close friend not to buy the stock.', score: -2, why: 'Tipping, even in the negative, is a breach.' },
      ],
    },
    {
      id: 'b2', scenario: 'Everything on your list is marked "urgent": a model turn for an MD, a pitch page for a VP and a data request from a client.',
      options: [
        { text: 'List the tasks with time estimates, share the list with the associates involved, and confirm the order. Client-facing work usually comes first.', score: 2, why: 'Being transparent about priorities makes the trade-offs explicit and shared.' },
        { text: 'Do the client request first, then the MD, then the VP, without telling anyone.', score: 1, why: 'A sensible order, but not communicating it risks surprising people.' },
        { text: 'Do the quickest task first to clear your list.', score: -1, why: 'Clearing your list is not the same as prioritising.' },
        { text: 'Work on all three in parallel, switching every half hour.', score: -2, why: 'Context-switching lowers quality and delays everything.' },
      ],
    },
    {
      id: 'b3', scenario: 'While staffed on a sell-side deal, you realise your uncle is a senior executive at one of the likely bidders.',
      options: [
        { text: 'Disclose the relationship to your staffer or compliance straight away.', score: 2, why: 'Potential conflicts of interest must be disclosed so the firm can manage them.' },
        { text: 'Stay on the deal but avoid discussing it with your uncle.', score: -1, why: 'Good intentions, but the firm needs to decide how to manage the conflict. Disclose it.' },
        { text: 'Ask to be taken off the deal without saying why.', score: -1, why: 'Leaves compliance unaware, and they may need to put wider controls in place.' },
        { text: 'Say nothing. It is unlikely to matter.', score: -2, why: 'Undisclosed conflicts are a serious compliance breach.' },
      ],
    },
    {
      id: 'b4', scenario: 'An MD asks why the EBITDA in your model differs from the figure in the client\'s management presentation.',
      options: [
        { text: 'Explain the reconciliation (for example, one-off items and adjustments) and point to the sources in the model.', score: 2, why: 'Data-driven and transparent. Every number should tie back to a source.' },
        { text: 'Say you will investigate and come back with a reconciliation within the hour.', score: 1, why: 'Honest if you do not know, but you should be able to explain your own model.' },
        { text: 'Change your figure to match the management presentation.', score: -1, why: 'Hides the difference without understanding it. Adjustments may be deliberate.' },
        { text: 'Say the difference is a rounding issue.', score: -2, why: 'Guessing or misleading a senior banker destroys trust.' },
      ],
    },
    {
      id: 'b5', scenario: 'You are sent the wrong virtual data room login and can see documents from a different deal.',
      options: [
        { text: 'Log out without opening anything further, and tell your associate and the VDR administrator.', score: 2, why: 'Protects confidentiality and the information barriers between deals.' },
        { text: 'Log out and ask for the correct login.', score: 1, why: 'Good, but the mistaken access also needs reporting.' },
        { text: 'Take a quick look. It might be useful market intelligence.', score: -2, why: 'A serious breach of confidentiality and information barriers.' },
        { text: 'Keep using it until the correct login arrives.', score: -2, why: 'Continued access makes the breach worse.' },
      ],
    },
    {
      id: 'b6', scenario: 'A client\'s CFO emails at 2am with a question about the purchase-price allocation. You are the only person awake on the team.',
      options: [
        { text: 'Acknowledge the email, give an answer if it is clearly within your knowledge and already agreed, and flag it to the team for morning follow-up.', score: 2, why: 'Responsive to the client while staying within your authority.' },
        { text: 'Acknowledge it and say the team will follow up first thing.', score: 1, why: 'Safe and professional, though a factual answer might have helped the client.' },
        { text: 'Give a detailed technical opinion on the accounting treatment.', score: -1, why: 'Accounting judgements are for the client\'s advisers and senior bankers. Stay in your lane.' },
        { text: 'Leave it until morning without acknowledging it.', score: -1, why: 'A senior client contact should get at least an acknowledgement.' },
      ],
    },
    {
      id: 'b7', scenario: 'You are asked to fill in missing comparable companies data "with reasonable estimates" because the database has gaps.',
      options: [
        { text: 'Fill the gaps from other sources (filings, other databases) and clearly mark any estimates and their basis.', score: 2, why: 'Being transparent about estimates keeps the analysis defensible.' },
        { text: 'Leave the gaps as "n/a" and explain why.', score: 1, why: 'Honest, but sourcing the data is usually possible and more helpful.' },
        { text: 'Put in numbers that keep the averages looking sensible, without flagging them.', score: -2, why: 'Fabricating data without disclosure is misleading.' },
        { text: 'Remove the companies with gaps from the set without telling anyone.', score: -1, why: 'Silently changing the peer set can distort the conclusions.' },
      ],
    },
    {
      id: 'b8', scenario: 'A recruiter from a competitor asks you to share your bank\'s pitch materials "just to see your style".',
      options: [
        { text: 'Decline. Firm materials are confidential.', score: 2, why: 'Pitch materials contain confidential client and firm information.' },
        { text: 'Decline, and mention the approach to your manager if it seemed inappropriate.', score: 2, why: 'Also excellent. Unusual requests for confidential material are worth flagging.' },
        { text: 'Share a version with the client names removed.', score: -2, why: 'Anonymising does not make firm-confidential material shareable.' },
        { text: 'Offer to describe the materials verbally instead.', score: -1, why: 'Still leaks proprietary information.' },
      ],
    },
    {
      id: 'b9', scenario: 'You spot that the share count in a merger model has not been updated for a recent buyback. The deck goes out in 30 minutes.',
      options: [
        { text: 'Tell your associate straight away, quantify the impact, and offer to update the affected pages fast.', score: 2, why: 'Speed plus transparency. The associate decides whether the deck can wait.' },
        { text: 'Quickly fix the model and the pages yourself, then tell your associate.', score: 1, why: 'Proactive, but last-minute changes nobody knows about can introduce new errors.' },
        { text: 'Let it go out and fix it in the next version.', score: -2, why: 'Sending a known error to a client is unacceptable.' },
        { text: 'Mention it after the deck has been sent.', score: -2, why: 'Knowingly letting an error through damages trust.' },
      ],
    },
    {
      id: 'b10', scenario: 'A friend who is applying to your bank asks you to forward them the interview questions you were asked.',
      options: [
        { text: 'Offer general advice and public resources, but do not share specific assessment content.', score: 2, why: 'Helpful while respecting confidentiality and fairness.' },
        { text: 'Politely decline to discuss the interview at all.', score: 1, why: 'Safe, though general advice is fine.' },
        { text: 'Forward your notes. It is only a friend.', score: -2, why: 'Undermines a fair process and may breach confidentiality agreements.' },
        { text: 'Refer them to someone else at the bank who might share questions.', score: -2, why: 'Passes the problem on. Still a breach.' },
      ],
    },
    {
      id: 'b11', scenario: 'On a live deal, the client\'s management keeps changing its projections and asking you to re-run the model each time.',
      options: [
        { text: 'Keep a version log and a change summary for each iteration, and flag big swings to your associate so they can discuss them with the client.', score: 2, why: 'Organised and transparent, and it gives seniors the information to manage the client.' },
        { text: 'Re-run the model each time as requested.', score: 1, why: 'Responsive, but without tracking changes, errors creep in.' },
        { text: 'Tell the client they need to finalise their numbers before you do any more work.', score: -2, why: 'Not your place, and it risks the relationship.' },
        { text: 'Only update the model once a day, regardless of requests.', score: -1, why: 'Rigid. Live deals need responsiveness.' },
      ],
    },
    {
      id: 'b12', scenario: 'You make an error that a VP catches just before a client meeting. The VP is visibly frustrated.',
      options: [
        { text: 'Own the mistake, fix it straight away, and afterwards explain what check you will add to prevent it happening again.', score: 2, why: 'Accountability plus a process fix is what seniors want to see.' },
        { text: 'Apologise and fix it.', score: 1, why: 'Good, and adding a prevention step builds more trust.' },
        { text: 'Explain that the data you were given was unclear.', score: -1, why: 'Even if it is true, leading with an excuse reads as deflecting.' },
        { text: 'Say nothing and hope it blows over.', score: -2, why: 'Missing the chance to show accountability hurts your reputation.' },
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // Conditional-logic clause bank: each triple forms a chain A → B → C.
  // ---------------------------------------------------------------------------
  S.CLAUSES = [
    [
      { p: 'Sam has been to the White House', n: 'Sam has not been to the White House' },
      { p: 'Sam has been to Washington DC', n: 'Sam has not been to Washington DC' },
      { p: 'Sam has been to the United States', n: 'Sam has not been to the United States' },
    ],
    [
      { p: 'the deal closes', n: 'the deal does not close' },
      { p: 'the team receives a success fee', n: 'the team does not receive a success fee' },
      { p: 'the quarterly revenue target is met', n: 'the quarterly revenue target is not met' },
    ],
    [
      { p: 'Ana is staffed on the pitch', n: 'Ana is not staffed on the pitch' },
      { p: 'Ana attends the Monday kick-off', n: 'Ana does not attend the Monday kick-off' },
      { p: 'Ana receives the client brief', n: 'Ana does not receive the client brief' },
    ],
    [
      { p: 'the model is locked', n: 'the model is not locked' },
      { p: 'the deck can be printed', n: 'the deck cannot be printed' },
      { p: 'the client meeting goes ahead', n: 'the client meeting does not go ahead' },
    ],
    [
      { p: 'it rains in the morning', n: 'it does not rain in the morning' },
      { p: 'the pitch is moved indoors', n: 'the pitch is not moved indoors' },
      { p: 'the boardroom is booked', n: 'the boardroom is not booked' },
    ],
    [
      { p: 'Acme plc is listed on the FTSE 100', n: 'Acme plc is not listed on the FTSE 100' },
      { p: 'Acme plc publishes annual reports', n: 'Acme plc does not publish annual reports' },
      { p: 'Acme plc\'s accounts are audited', n: 'Acme plc\'s accounts are not audited' },
    ],
    [
      { p: 'Leo passes the assessment', n: 'Leo does not pass the assessment' },
      { p: 'Leo is invited to interview', n: 'Leo is not invited to interview' },
      { p: 'Leo receives a scheduling email', n: 'Leo does not receive a scheduling email' },
    ],
    [
      { p: 'the MD approves the valuation', n: 'the MD does not approve the valuation' },
      { p: 'the fairness opinion is issued', n: 'the fairness opinion is not issued' },
      { p: 'the board votes on the merger', n: 'the board does not vote on the merger' },
    ],
    [
      { p: 'Jo breaches the trading limit', n: 'Jo does not breach the trading limit' },
      { p: 'risk management is notified', n: 'risk management is not notified' },
      { p: 'an incident report is filed', n: 'an incident report is not filed' },
    ],
    [
      { p: 'the office is closed', n: 'the office is not closed' },
      { p: 'everyone works from home', n: 'not everyone works from home' },
      { p: 'the VPN is in use', n: 'the VPN is not in use' },
    ],
    [
      { p: 'a Flint glows', n: 'a Flint does not glow' },
      { p: 'the Glare hums', n: 'the Glare does not hum' },
      { p: 'the Mote spins', n: 'the Mote does not spin' },
    ],
    [
      { p: 'the bond is investment grade', n: 'the bond is not investment grade' },
      { p: 'the pension fund may hold the bond', n: 'the pension fund may not hold the bond' },
      { p: 'the bond appears on the approved list', n: 'the bond does not appear on the approved list' },
    ],
    [
      { p: 'Priya is in the office', n: 'Priya is not in the office' },
      { p: 'the printer is switched on', n: 'the printer is not switched on' },
      { p: 'the lights on floor 4 are on', n: 'the lights on floor 4 are not on' },
    ],
    [
      { p: 'the market opens higher', n: 'the market does not open higher' },
      { p: 'the fund rebalances', n: 'the fund does not rebalance' },
      { p: 'the portfolio manager is informed', n: 'the portfolio manager is not informed' },
    ],
  ];

  S.NOUNS = ['Flints', 'Glares', 'Motes', 'Zorbs', 'Plinks', 'Trems', 'Vosks', 'Quills', 'Brams', 'Snives', 'Klets', 'Dranes', 'Wisps', 'Fobs', 'Grells', 'Yaps'];

  S.SHAPES = [
    { sides: 3, name: 'Triangle' }, { sides: 4, name: 'Square' }, { sides: 5, name: 'Pentagon' },
    { sides: 6, name: 'Hexagon' }, { sides: 7, name: 'Heptagon' }, { sides: 8, name: 'Octagon' },
    { sides: 9, name: 'Nonagon' }, { sides: 10, name: 'Decagon' },
  ];
})(window.Suited);
