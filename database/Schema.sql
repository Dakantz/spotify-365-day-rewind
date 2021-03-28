DROP TABLE IF EXISTS Users,
Genres,
Artists,
ArtistGenres,
Albums,
Plays,
Playlists,
Songs;
CREATE TABLE Users(
    userId SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL,
    token VARCHAR(512) NOT NULL,
    refreshToken VARCHAR(512) NOT NULL,
    redirectUrl VARCHAR(512) NOT NULL,
    report_weekly BOOLEAN DEFAULT(FALSE) NOT NULL,
    report_monthly BOOLEAN DEFAULT(FALSE) NOT NULL,
    allow_public_display BOOLEAN NOT NULL DEFAULT false,
    uri VARCHAR(256) NOT NULL
);
CREATE TABLE Genres(
    gId SERIAL PRIMARY KEY,
    name VARCHAR(256) UNIQUE NOT NULL
);
CREATE TABLE Artists(
    artistId SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    uri VARCHAR(256) NOT NULL
);
CREATE TABLE ArtistGenres(
    id SERIAL PRIMARY KEY,
    artistId INT NOT NULL REFERENCES Artists,
    gId INT NOT NULL REFERENCES Genres
);
CREATE TABLE Albums(
    albumId SERIAL PRIMARY KEY,
    artistId INT NOT NULL REFERENCES Artists,
    name VARCHAR(256) NOT NULL,
    uri VARCHAR(256) NOT NULL
);
CREATE TABLE Songs(
    songId SERIAL PRIMARY KEY,
    explicit BOOLEAN NOT NULL,
    albumId INT NOT NULL REFERENCES Albums,
    artistId INT NOT NULL REFERENCES Artists,
    name VARCHAR(256) NOT NULL,
    uri VARCHAR(256) NOT NULL,
    duration_ms INT NOT NULL
);
CREATE TABLE Plays(
    playId SERIAL PRIMARY KEY,
    time TIMESTAMP NOT NULL,
    songId INT NOT NULL REFERENCES Songs,
    userId INT NOT NULL REFERENCES Users,
    CONSTRAINT u_constraint UNIQUE(time, songId, userId)
);
CREATE TABLE Playlists (
    playlistId SERIAL PRIMARY KEY,
    userId INT NOT NULL REFERENCES Users,
    parameters json NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT now(),
    last_update TIMESTAMP NOT NULL DEFAULT now(),
    uri VARCHAR(256) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);