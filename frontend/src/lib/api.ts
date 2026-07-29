import type { AuthResponse, BacklogEntry, BacklogStatus, GameSummary, Stats } from "../types";

const API_BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type GraphQLUser = {
  id: string;
  email: string;
};

type GraphQLAuthResponse = {
  token: string;
  user: GraphQLUser;
};

type GraphQLGameSummary = {
  id: number;
  name: string;
  coverUrl: string | null;
  releaseYear: number | null;
};

type GraphQLBacklogStatus = "WANT_TO_PLAY" | "PLAYING" | "COMPLETED" | "ABANDONED";

type GraphQLBacklogEntry = {
  id: string;
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  releaseYear: number | null;
  status: GraphQLBacklogStatus;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

type GraphQLStats = {
  want_to_play: number;
  playing: number;
  completed: number;
  abandoned: number;
  avgRating: number | null;
};

type GraphQLRegisterMutation = {
  register: GraphQLAuthResponse;
};

type GraphQLLoginMutation = {
  login: GraphQLAuthResponse;
};

type GraphQLSearchQuery = {
  searchGames: GraphQLGameSummary[];
};

type GraphQLBacklogQuery = {
  backlog: GraphQLBacklogEntry[];
};

type GraphQLStatsQuery = {
  backlogStats: GraphQLStats;
};

type GraphQLAddBacklogMutation = {
  addToBacklog: GraphQLBacklogEntry;
};

type GraphQLUpdateBacklogMutation = {
  updateBacklog: GraphQLBacklogEntry;
};

function toGraphQLStatus(status: BacklogStatus): GraphQLBacklogStatus {
  switch (status) {
    case "want_to_play":
      return "WANT_TO_PLAY";
    case "playing":
      return "PLAYING";
    case "completed":
      return "COMPLETED";
    case "abandoned":
      return "ABANDONED";
  }
}

function toAppStatus(status: GraphQLBacklogStatus): BacklogStatus {
  switch (status) {
    case "WANT_TO_PLAY":
      return "want_to_play";
    case "PLAYING":
      return "playing";
    case "COMPLETED":
      return "completed";
    case "ABANDONED":
      return "abandoned";
  }
}

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const body = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok) {
    throw new Error(body.errors?.[0]?.message ?? "Request failed.");
  }

  if (body.errors?.length) {
    throw new Error(body.errors[0].message);
  }

  if (!body.data) {
    throw new Error("Request failed.");
  }

  return body.data;
}

function toAuthResponse(response: GraphQLAuthResponse): AuthResponse {
  return {
    token: response.token,
    user: response.user
  };
}

function toGameSummary(game: GraphQLGameSummary): GameSummary {
  return game;
}

function toBacklogEntry(entry: GraphQLBacklogEntry): BacklogEntry {
  return {
    ...entry,
    status: toAppStatus(entry.status)
  };
}

function toStats(stats: GraphQLStats): Stats {
  return stats;
}

const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($input: CredentialsInput!) {
    register(input: $input) {
      token
      user {
        id
        email
      }
    }
  }
`;

const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($input: CredentialsInput!) {
    login(input: $input) {
      token
      user {
        id
        email
      }
    }
  }
`;

const SEARCH_QUERY = /* GraphQL */ `
  query SearchGames($query: String!) {
    searchGames(query: $query) {
      id
      name
      coverUrl
      releaseYear
    }
  }
`;

const BACKLOG_QUERY = /* GraphQL */ `
  query Backlog {
    backlog {
      id
      gameId
      gameName
      coverUrl
      releaseYear
      status
      rating
      createdAt
      updatedAt
    }
  }
`;

const STATS_QUERY = /* GraphQL */ `
  query BacklogStats {
    backlogStats {
      want_to_play
      playing
      completed
      abandoned
      avgRating
    }
  }
`;

const ADD_TO_BACKLOG_MUTATION = /* GraphQL */ `
  mutation AddToBacklog($input: AddBacklogInput!) {
    addToBacklog(input: $input) {
      id
      gameId
      gameName
      coverUrl
      releaseYear
      status
      rating
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_BACKLOG_MUTATION = /* GraphQL */ `
  mutation UpdateBacklog($id: ID!, $input: UpdateBacklogInput!) {
    updateBacklog(id: $id, input: $input) {
      id
      gameId
      gameName
      coverUrl
      releaseYear
      status
      rating
      createdAt
      updatedAt
    }
  }
`;

export const api = {
  register(email: string, password: string) {
    return graphqlRequest<GraphQLRegisterMutation>(REGISTER_MUTATION, {
      input: { email, password }
    }).then((data) => toAuthResponse(data.register));
  },
  login(email: string, password: string) {
    return graphqlRequest<GraphQLLoginMutation>(LOGIN_MUTATION, {
      input: { email, password }
    }).then((data) => toAuthResponse(data.login));
  },
  searchGames(query: string) {
    return graphqlRequest<GraphQLSearchQuery>(SEARCH_QUERY, { query }).then((data) =>
      data.searchGames.map(toGameSummary)
    );
  },
  fetchBacklog(token: string) {
    return graphqlRequest<GraphQLBacklogQuery>(BACKLOG_QUERY, undefined, token).then((data) =>
      data.backlog.map(toBacklogEntry)
    );
  },
  fetchStats(token: string) {
    return graphqlRequest<GraphQLStatsQuery>(STATS_QUERY, undefined, token).then((data) =>
      toStats(data.backlogStats)
    );
  },
  addToBacklog(game: GameSummary, status: BacklogStatus, token: string) {
    return graphqlRequest<GraphQLAddBacklogMutation>(ADD_TO_BACKLOG_MUTATION, {
      input: {
        gameId: game.id,
        name: game.name,
        coverUrl: game.coverUrl,
        releaseYear: game.releaseYear,
        status: toGraphQLStatus(status)
      }
    }, token).then((data) => toBacklogEntry(data.addToBacklog));
  },
  updateBacklog(id: string, status: BacklogStatus, rating: number | null | undefined, token: string) {
    return graphqlRequest<GraphQLUpdateBacklogMutation>(UPDATE_BACKLOG_MUTATION, {
      id,
      input: {
        status: toGraphQLStatus(status),
        rating
      }
    }, token).then((data) => toBacklogEntry(data.updateBacklog));
  }
};
