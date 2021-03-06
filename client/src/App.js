import React, { useState } from "react";

//styles
import * as S from "./styles";
import background from "./images/background.svg";
import "rodal/lib/rodal.css";

// custom components
import FacebookLogin from "react-facebook-login";
import axios from "axios";
import Rodal from "rodal";
import { Container, Button } from "react-floating-action-button";

// imports
import AddContact from "./components/AddContact";
import ContactInfo from "./components/ContactInfo";

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [avatar, setAvatar] = useState("");
  const [token, setToken] = useState("");
  const [contactList, setContactList] = useState([]);

  const [addModal, showAddModal] = useState(false);
  const [hideContact, sethideContact] = useState(false);
  const [person, setPerson] = useState(null);

  const responseFacebook = async response => {
    console.log(response);
    await axios
      .post(`/api/auth/facebook`, { access_token: response.accessToken })
      .then(r => {
        console.log(r);
        const token = r.headers["x-auth-token"];
        if (token) {
          setAuthenticated(true);
          setToken(token);
          setAvatar(r.data.photos[0].value);
          setUser(r.data);
          getContact(r.data.id, token);
        }
      });
  };

  const getContact = async (user_id, token) => {
    // await axios
    //   .get(`/token`, {
    //     headers: { Authorization: "bearer " + token }
    //   })
    //   .then(result => {
    //     console.log(result);
    //   });
    await axios
      .get(`/api/contacts/get/${user_id}`, {
        headers: { Authorization: "bearer " + token }
      })
      .then(result => {
        setContactList(result.data.data);
        console.log(result.data.data);
      });
  };

  return (
    <div className="App">
      <S.Background src={background} />
      {!isAuthenticated && user !== {} ? (
        <S.FacebookContainer>
          <FacebookLogin
            appId="2430182417265110"
            fields="name,email,picture"
            callback={response => responseFacebook(response)}
          />
        </S.FacebookContainer>
      ) : (
        <>
          <S.UserDetail>
            <S.Avatar src={avatar} />
            <S.UserName>{user.displayName}</S.UserName>
          </S.UserDetail>
          <S.ContactsContainer>
            <S.ContactList>
              <S.Bar>
                <S.Title> Contact List </S.Title>
              </S.Bar>
              {contactList !== [] &&
                contactList.map(function(c) {
                  var contactStyles = {
                    backgroundColor: c === person ? "#bbdefb" : ""
                  };
                  return (
                    <S.Contact
                      onClick={() => {
                        setPerson(c);
                        sethideContact(false);
                      }}
                      style={contactStyles}
                    >
                      <span>
                        {c.firstname} {c.lastname}
                      </span>
                    </S.Contact>
                  );
                }, this)}
            </S.ContactList>

            {!hideContact && (
              <S.ContactInfo>
                <ContactInfo
                  person={person}
                  token={token}
                  getContact={getContact}
                  sethideContact={sethideContact}
                />
              </S.ContactInfo>
            )}
          </S.ContactsContainer>
          <Container>
            <Button
              tooltip="Add Contact"
              // icon="fa-plus"
              rotate={true}
              onClick={() => showAddModal(true)}
              styles={{
                backgroundColor: "#bbdefb",
                color: "#0d47a1",
                fontSize: 32
              }}
            >
              +
            </Button>
          </Container>
          <Rodal
            visible={addModal}
            onClose={() => showAddModal(false)}
            customStyles={{
              background: "#bbdefb",
              borderRadius: 15,
              width: 325,
              height: 350
            }}
          >
            <S.AddContactTitle>Add Contact</S.AddContactTitle>
            <AddContact
              user_id={user.id}
              token={token}
              getContact={getContact}
              showAddModal={showAddModal}
            />
          </Rodal>
        </>
      )}
    </div>
  );
}

export default App;
