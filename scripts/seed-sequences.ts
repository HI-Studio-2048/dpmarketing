/**
 * Seed example email marketing flows via the live API.
 * Usage: npx tsx scripts/seed-sequences.ts
 */

const API = "https://team.danielphilip.com";

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f7f7f7; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px; }
    .body { padding: 35px 30px; }
    .body h2 { color: #1a1a2e; font-size: 20px; margin-bottom: 15px; }
    .body p { color: #555; font-size: 15px; margin-bottom: 15px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .footer { padding: 25px 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    .footer a { color: #667eea; text-decoration: none; }
    .highlight { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .highlight p { margin: 0; color: #444; }
    ul { padding-left: 20px; }
    li { color: #555; font-size: 15px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      ${content}
      <div class="footer">
        <p>Daniel Philip Marketing</p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

interface SequenceConfig {
  name: string;
  description: string;
  is_active: boolean;
  steps: Array<{
    step_number: number;
    day_offset: number;
    subject: string;
    html_body: string;
    step_key: string;
    email_type: string;
  }>;
}

const sequences: SequenceConfig[] = [
  {
    name: "Welcome Series",
    description: "Onboard new leads with a 5-email welcome sequence over 7 days",
    is_active: true,
    steps: [
      {
        step_number: 1,
        day_offset: 0,
        subject: "Welcome {{first_name}} — Here's what to expect",
        step_key: "welcome",
        email_type: "welcome",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Welcome to the Community!</h1>
            <p>You're in the right place, {{first_name}}</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>Thank you for joining us! I'm Daniel, and I'm excited to have you here.</p>
            <p>Over the next few days, I'm going to share some of my best insights on building a life of freedom, impact, and financial independence.</p>
            <div class="highlight">
              <p><strong>Here's what's coming:</strong></p>
            </div>
            <ul>
              <li>Day 1: My story — from zero to building a global business</li>
              <li>Day 3: The #1 mistake people make when starting out</li>
              <li>Day 5: A simple framework that changed everything for me</li>
              <li>Day 7: Your exclusive invitation</li>
            </ul>
            <p>Keep an eye on your inbox — the good stuff is coming.</p>
            <p>Talk soon,<br><strong>Daniel Philip</strong></p>
          </div>`),
      },
      {
        step_number: 2,
        day_offset: 1,
        subject: "My story (and why I'm sharing it with you)",
        step_key: "story",
        email_type: "value",
        html_body: emailTemplate(`
          <div class="header">
            <h1>My Story</h1>
            <p>How it all started</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>A few years ago, I was stuck. Working long hours, no freedom, no purpose. Something had to change.</p>
            <p>I made a decision: I would build something that gives me the freedom to live life on my own terms while helping others do the same.</p>
            <p>It wasn't easy. There were failures, late nights, and moments of doubt. But step by step, I built a system that works.</p>
            <div class="highlight">
              <p><strong>The key insight:</strong> Success isn't about working harder — it's about working smarter with the right system and the right community around you.</p>
            </div>
            <p>Tomorrow I'm going to share the #1 mistake I see people make. It's the same one I made for years before I figured it out.</p>
            <p>Stay tuned,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 3,
        day_offset: 3,
        subject: "The #1 mistake (I made it for years)",
        step_key: "mistake",
        email_type: "education",
        html_body: emailTemplate(`
          <div class="header">
            <h1>The #1 Mistake</h1>
            <p>Almost everyone makes this</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>Want to know the biggest mistake I see people make when they're trying to build something meaningful?</p>
            <p><strong>They try to do it alone.</strong></p>
            <p>I spent years thinking I had to figure everything out myself. I wasted time, money, and energy on things that didn't move the needle.</p>
            <p>The moment I found a community of like-minded people with a proven system — everything changed.</p>
            <div class="highlight">
              <p><strong>The truth is:</strong> You don't need to reinvent the wheel. You need the right vehicle, the right map, and the right people riding with you.</p>
            </div>
            <p>In my next email, I'll share the exact framework I use to create results consistently. It's simpler than you think.</p>
            <p>To your success,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 4,
        day_offset: 5,
        subject: "The simple framework that changed everything",
        step_key: "framework",
        email_type: "value",
        html_body: emailTemplate(`
          <div class="header">
            <h1>The Framework</h1>
            <p>Simple. Proven. Effective.</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>I promised I'd share the framework that changed everything for me. Here it is:</p>
            <div class="highlight">
              <p><strong>The 3-Step Freedom Framework:</strong></p>
            </div>
            <ul>
              <li><strong>Step 1: Learn</strong> — Get the right knowledge from people who've already done what you want to do</li>
              <li><strong>Step 2: Apply</strong> — Take consistent daily action, even when it's small</li>
              <li><strong>Step 3: Leverage</strong> — Use systems and community to multiply your results</li>
            </ul>
            <p>It sounds simple because it IS simple. The hard part isn't the strategy — it's the consistency and having the right support system.</p>
            <p>That's exactly what we provide. A proven path, daily support, and a community that holds you accountable.</p>
            <p>Tomorrow I have something special for you. Keep an eye out.</p>
            <p>Let's go,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 5,
        day_offset: 7,
        subject: "{{first_name}}, your exclusive invitation",
        step_key: "invitation",
        email_type: "offer",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Your Invitation</h1>
            <p>This is for you, {{first_name}}</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>Over the past week, I've shared my story, the biggest mistake people make, and the framework I use to create results.</p>
            <p>Now it's your turn.</p>
            <p>I'd like to personally invite you to learn more about how we can work together. Whether that's through our community, our training programs, or a 1-on-1 conversation — I want to help you take the next step.</p>
            <div class="highlight">
              <p><strong>What you get:</strong> A proven system, a supportive community, expert guidance, and the accountability to actually follow through.</p>
            </div>
            <p style="text-align: center;">
              <a href="https://danielphilip.com" class="cta">Learn More</a>
            </p>
            <p>If you have any questions, just reply to this email. I read every single one.</p>
            <p>To your freedom,<br><strong>Daniel Philip</strong></p>
          </div>`),
      },
    ],
  },
  {
    name: "Value Nurture Series",
    description: "Provide value and build trust over 2 weeks — educational content",
    is_active: false,
    steps: [
      {
        step_number: 1,
        day_offset: 0,
        subject: "3 mindset shifts that changed my income",
        step_key: "mindset",
        email_type: "education",
        html_body: emailTemplate(`
          <div class="header">
            <h1>3 Mindset Shifts</h1>
            <p>That changed my income forever</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>Your income is a direct reflection of your mindset. Here are 3 shifts that changed mine:</p>
            <ul>
              <li><strong>From "I can't afford it" to "How can I afford it?"</strong> — This one question opens doors your mind was keeping locked.</li>
              <li><strong>From consumer to creator</strong> — Stop scrolling, start building. Every hour spent creating compounds.</li>
              <li><strong>From lone wolf to team player</strong> — The fastest way to grow is to learn from those ahead of you.</li>
            </ul>
            <p>Which one resonates most with you? Hit reply and let me know.</p>
            <p>More value coming your way soon,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 2,
        day_offset: 3,
        subject: "The morning routine that built my business",
        step_key: "routine",
        email_type: "value",
        html_body: emailTemplate(`
          <div class="header">
            <h1>My Morning Routine</h1>
            <p>How I win before 9 AM</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>People always ask me how I stay productive while traveling the world and running my business. The answer is simple: my morning routine.</p>
            <div class="highlight">
              <p><strong>My non-negotiable morning stack:</strong></p>
            </div>
            <ul>
              <li><strong>5:30 AM</strong> — Wake up, no phone for first 30 mins</li>
              <li><strong>6:00 AM</strong> — 20 mins of reading or personal development</li>
              <li><strong>6:20 AM</strong> — Journal: 3 things I'm grateful for, 3 goals for today</li>
              <li><strong>6:30 AM</strong> — Deep work block (the ONE thing that moves the needle)</li>
              <li><strong>8:00 AM</strong> — Exercise + fuel my body right</li>
            </ul>
            <p>The key? <strong>Protect your mornings.</strong> When you win the morning, you win the day.</p>
            <p>Try this for just 7 days and watch what happens.</p>
            <p>Rooting for you,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 3,
        day_offset: 7,
        subject: "How I make money while I sleep (not clickbait)",
        step_key: "passive",
        email_type: "value",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Income While You Sleep</h1>
            <p>This is how leverage works</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>I know the headline sounds like clickbait. But let me explain what I mean by "making money while I sleep."</p>
            <p>It's not magic. It's <strong>leverage</strong>.</p>
            <p>There are 4 types of leverage:</p>
            <ul>
              <li><strong>Labor</strong> — Other people working for/with you</li>
              <li><strong>Capital</strong> — Money working for you</li>
              <li><strong>Code</strong> — Software running 24/7</li>
              <li><strong>Media</strong> — Content that reaches people while you sleep</li>
            </ul>
            <p>Most people only use labor (trading time for money). The wealthy use all four.</p>
            <div class="highlight">
              <p>The system I use combines <strong>media + community + proven products</strong> to create recurring income that doesn't require me to trade hours for dollars.</p>
            </div>
            <p>Want to know more about how this works? I'll share the details in my next email.</p>
            <p>Stay curious,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 4,
        day_offset: 10,
        subject: "{{first_name}}, let's connect",
        step_key: "connect",
        email_type: "offer",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Let's Connect</h1>
            <p>I'd love to hear from you</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>I've been sharing a lot of value over the past week and I'd love to hear where you're at.</p>
            <p><strong>Quick question:</strong> What's the #1 thing you're working toward right now?</p>
            <p>Whether it's:</p>
            <ul>
              <li>Starting a side income</li>
              <li>Leaving your 9-5</li>
              <li>Scaling what you already have</li>
              <li>Finding more freedom and purpose</li>
            </ul>
            <p>I'd genuinely love to know. Just hit reply and tell me in a few words.</p>
            <p>If you're ready to take the next step, I have something that might be exactly what you need:</p>
            <p style="text-align: center;">
              <a href="https://danielphilip.com" class="cta">See How We Can Work Together</a>
            </p>
            <p>Either way, I'm here to help.</p>
            <p>Let's make it happen,<br><strong>Daniel Philip</strong></p>
          </div>`),
      },
    ],
  },
  {
    name: "Re-engagement Campaign",
    description: "Win back leads who haven't opened emails in 14+ days",
    is_active: false,
    steps: [
      {
        step_number: 1,
        day_offset: 0,
        subject: "{{first_name}}, I noticed you've been quiet",
        step_key: "reengagement_1",
        email_type: "behavioral",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Missing You</h1>
            <p>Just checking in</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>I noticed you haven't been opening my emails lately, and I wanted to check in.</p>
            <p>No pressure at all — life gets busy, I get it.</p>
            <p>But I wanted to make sure you're still getting value from being on this list. I've got some exciting things coming up that I think you'll love.</p>
            <div class="highlight">
              <p><strong>Coming soon:</strong> A brand new training on how to start generating income online — even with zero experience. It's the simplest path I know.</p>
            </div>
            <p>If you want to stay in the loop, you don't need to do anything. But if you'd rather not hear from me, no hard feelings — you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
            <p>Hope to see you around,<br><strong>Daniel</strong></p>
          </div>`),
      },
      {
        step_number: 2,
        day_offset: 3,
        subject: "Should I remove you from the list?",
        step_key: "reengagement_2",
        email_type: "urgency",
        html_body: emailTemplate(`
          <div class="header">
            <h1>Quick Question</h1>
            <p>Do you still want to hear from me?</p>
          </div>
          <div class="body">
            <h2>Hey {{first_name}},</h2>
            <p>I like to keep my email list clean — I only want to send to people who actually want to hear from me.</p>
            <p>I haven't heard from you in a while, so I wanted to give you an easy choice:</p>
            <ul>
              <li><strong>Want to stay?</strong> Just open this email (you already did!) and you'll keep getting my best content.</li>
              <li><strong>Want to go?</strong> No problem. <a href="{{unsubscribe_url}}">Click here to unsubscribe</a> and I'll wish you all the best.</li>
            </ul>
            <p>Either way, I respect your time and attention.</p>
            <p>All the best,<br><strong>Daniel Philip</strong></p>
          </div>`),
      },
    ],
  },
];

async function main() {
  console.log("Seeding email marketing flows...\n");

  for (const seq of sequences) {
    console.log(`Creating: ${seq.name}`);

    // Create the sequence
    const res = await fetch(`${API}/api/admin/sequences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: seq.name,
        description: seq.description,
      }),
    });

    if (!res.ok) {
      console.error(`  Failed to create sequence: ${await res.text()}`);
      continue;
    }

    const { sequence } = await res.json();
    const seqId = sequence.id;
    console.log(`  Created with ID: ${seqId}`);

    // Set active/inactive
    if (!seq.is_active) {
      await fetch(`${API}/api/admin/sequences/${seqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
    }

    // Add steps
    for (const step of seq.steps) {
      const stepRes = await fetch(`${API}/api/admin/sequences/${seqId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step),
      });

      if (stepRes.ok) {
        console.log(`  + Step ${step.step_number}: ${step.subject.replace("{{first_name}}", "[Name]")}`);
      } else {
        console.error(`  Failed step ${step.step_number}: ${await stepRes.text()}`);
      }
    }

    console.log(`  Done! (${seq.is_active ? "ACTIVE" : "INACTIVE"})\n`);
  }

  console.log("All flows seeded successfully!");
}

main();
