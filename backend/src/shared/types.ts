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