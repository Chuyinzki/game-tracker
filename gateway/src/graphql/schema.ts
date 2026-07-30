export const schema = /* GraphQL */ `
  enum BacklogStatus {
    WANT_TO_PLAY
    PLAYING
    COMPLETED
    ABANDONED
  }

  type User {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type GameSummary {
    id: Int!
    name: String!
    coverUrl: String
    releaseYear: Int
  }

  type BacklogEntry {
    id: ID!
    gameId: Int!
    gameName: String!
    coverUrl: String
    releaseYear: Int
    status: BacklogStatus!
    rating: Int
    createdAt: String!
    updatedAt: String!
  }

  type Stats {
    want_to_play: Int!
    playing: Int!
    completed: Int!
    abandoned: Int!
    avgRating: Float
  }

  type DashboardInsights {
    totalEntries: Int!
    completedEntries: Int!
    averageRating: Float
    recentEventCount: Int!
    latestEventType: String
    latestEventGame: String
    topRatedGame: String
    recentEvents: [RecentEvent!]!
    generatedAt: String!
  }

  type RecentEvent {
    eventType: String!
    gameName: String!
    status: String!
    occurredAt: String!
  }

  type NotificationDigest {
    notificationCount: Int!
    latestNotificationTitle: String
    latestNotificationGame: String
    recentNotifications: [NotificationItem!]!
    generatedAt: String!
  }

  type NotificationItem {
    eventType: String!
    title: String!
    message: String!
    severity: String!
    gameName: String!
    status: String!
    occurredAt: String!
  }

  input CredentialsInput {
    email: String!
    password: String!
  }

  input AddBacklogInput {
    gameId: Int!
    name: String!
    coverUrl: String
    releaseYear: Int
    status: BacklogStatus!
  }

  input UpdateBacklogInput {
    status: BacklogStatus
    rating: Int
  }

  type Query {
    me: User
    searchGames(query: String!): [GameSummary!]!
    game(id: Int!): GameSummary
    backlog: [BacklogEntry!]!
    backlogStats: Stats!
    dashboardInsights: DashboardInsights!
    notificationDigest: NotificationDigest!
  }

  type Mutation {
    register(input: CredentialsInput!): AuthPayload!
    login(input: CredentialsInput!): AuthPayload!
    addToBacklog(input: AddBacklogInput!): BacklogEntry!
    updateBacklog(id: ID!, input: UpdateBacklogInput!): BacklogEntry!
  }
`;
