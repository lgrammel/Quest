import React from "react";
import _ from "lodash";
import { loadGoogleDriveClient, removeAccessToken } from "./auth";
import { Link } from "react-router-dom";

export function DriveSearchResults({ searchData = {} }) {
  const [isSignedIn, setIsSignedIn] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    loadGoogleDriveClient(setIsSignedIn, { logInIfUnauthorized: false });
  }, [isSignedIn]);

  React.useEffect(() => {
    async function listFiles() {
      if (!isSignedIn) {
        return;
      }

      try {
        const response = await window.gapi.client.drive.files.list({
          q: `name contains '${searchData.input}'`,
          pageSize: 5,
          fields: "nextPageToken, files(id, name)",
        });
        setData(response);
      } catch (e) {
        console.error(e);
        if (e?.status === 401) {
          await Promise.all([
            removeAccessToken(),
            loadGoogleDriveClient(setIsSignedIn),
          ]);
          return listFiles();
        }
        setError(e);
      }
    }
    listFiles();
  }, [searchData, isSignedIn]);

  if (isSignedIn === false) {
    return (
      <div>
        Not authenticated. Go to the <Link to="/settings">settings</Link> to
        setup the Google Drive module.
      </div>
    );
  }

  if (error) {
    return <div>Failed to load {JSON.stringify(error)}</div>;
  }

  if (!data) {
    return <div>Loading Google Drive results...</div>;
  }

  return (
    <ul>
      {_.take(data?.result?.files, 5).map(({ name, id }) => (
        <li key={id}>{name}</li>
      ))}
    </ul>
  );
}
