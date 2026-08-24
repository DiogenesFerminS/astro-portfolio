import { GITHUB_TOKEN } from "astro:env/server";

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
  // Se resuelve en cada request dentro de la funcion de Netlify (no se inlinea al build).
  const token = GITHUB_TOKEN;

  if (!token) {
    console.error(
      "[github] GITHUB_TOKEN no esta definido en runtime. " +
        "Definilo en Netlify > Site configuration > Environment variables " +
        "(scope: Functions) y volve a desplegar.",
    );
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
    } else {
      console.error(
        `[github] No se pudo leer createdAt (HTTP ${userRes.status}):`,
        JSON.stringify(userData).slice(0, 300),
      );
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
        if (data.errors) {
          console.error(`[github] GraphQL error para ${year}:`, JSON.stringify(data.errors));
          return;
        }
        const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;
        if (calendar) {
          yearlyData[year] = calendar;
        } else {
          console.error(`[github] Respuesta sin calendario para ${year}:`, JSON.stringify(data).slice(0, 300));
        }
      })
      .catch(err => console.error(`Error fetching year ${year}`, err));

    fetchPromises.push(p);
  }

  await Promise.all(fetchPromises);

  return Object.keys(yearlyData).length > 0 ? yearlyData : null;
}
