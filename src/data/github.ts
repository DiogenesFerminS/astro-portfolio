export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface YearlyContributions {
  [year: number]: ContributionCalendar;
}

export async function getGithubContributions(username: string): Promise<YearlyContributions | null> {
  const token = import.meta.env.GITHUB_TOKEN;

  if (!token) {
    console.error("GITHUB_TOKEN is not defined in .env");
    return null;
  }

  const userQuery = `
    query($userName:String!) {
      user(login: $userName){
        createdAt
      }
    }
  `;

  let startYear = new Date().getFullYear();
  const currentYear = new Date().getFullYear();

  try {
    const userRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: userQuery, variables: { userName: username } }),
    });
    const userData = await userRes.json();
    if (userData?.data?.user?.createdAt) {
      startYear = new Date(userData.data.user.createdAt).getFullYear();
    }
  } catch (error) {
    console.error("Error fetching user creation date, defaulting to current year", error);
  }

  if (currentYear - startYear > 5) {
    startYear = currentYear - 4;
  }

  const yearlyData: YearlyContributions = {};

  const query = `
    query($userName:String!, $from:DateTime!, $to:DateTime!) {
      user(login: $userName){
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const fetchPromises = [];
  for (let year = startYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const p = fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables: { userName: username, from, to } }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.errors && data.data?.user?.contributionsCollection?.contributionCalendar) {
          yearlyData[year] = data.data.user.contributionsCollection.contributionCalendar;
        }
      })
      .catch(err => console.error(`Error fetching year ${year}`, err));

    fetchPromises.push(p);
  }

  await Promise.all(fetchPromises);

  return Object.keys(yearlyData).length > 0 ? yearlyData : null;
}
