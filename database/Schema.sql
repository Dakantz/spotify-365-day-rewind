DROP TABLE IF EXISTS Users,
Genres,
Artists,
ArtistGenres,
Albums,
Plays,
Songs;
CREATE TABLE Users(
    userId SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL,
    token VARCHAR(512) NOT NULL,
    refreshToken VARCHAR(512) NOT NULL,
    redirectUrl VARCHAR(512) NOT NULL,
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
    uri VARCHAR(256) NOT NULL
);
CREATE TABLE Plays(
    playId SERIAL PRIMARY KEY,
    time TIMESTAMP NOT NULL,
    songId INT NOT NULL REFERENCES Songs,
    userId INT NOT NULL REFERENCES Users,
    CONSTRAINT u_constraint UNIQUE(time, songId, userId)
);