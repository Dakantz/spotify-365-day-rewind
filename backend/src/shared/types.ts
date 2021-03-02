export class InitJob {
  public static jobName = "initialize-user";
  constructor(public userId: number, public token: string) {}
}
export class RefreshTokenJob {
  public static jobName = "refresh-token";
  constructor(
    public userId: number,
    public refresh_token: string,
    public client_id: string,
    public client_secret: string
  ) {}
}
export class SyncPlaysJob {
  public static jobName = "sync-plays";
  constructor(public userId: number) {}
}

export class DeleteUserJob {
  public static jobName = "delete-me";
  constructor(public userId: number) {}
}
export class ExportMeJob {
  public static jobName = "export-me";
  constructor(public userId: number) {}
}
//5 8 * * Sun
export class WeeklyReport {
  public static jobName = "report-weekly";
  constructor() {}
}
export class MonthlyReport {
  public static jobName = "report-monthly";
  constructor() {}
}

export class PlaylistRefresh {
  public static jobName = "playlist-refresh";
  constructor(public userId: number, public playlistId: number) {}
}
