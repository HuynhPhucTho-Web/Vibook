import React, { useContext,} from "react";
import { NavLink, useParams } from "react-router-dom";
import "../../style/GroupSidebar.css";
import {LanguageContext} from "../../context/LanguageContext";

export default function GroupSidebar() {
  const { groupId } = useParams();

  const cls = ({ isActive }) => `gst-tab ${isActive ? "is-active" : ""}`;
  const { t } = useContext(LanguageContext);

  return (
    <div className="gst-wrap">
      <nav className="gst-nav" aria-label="Group tabs">
        <NavLink to={`/groups/${groupId}`} end className={cls}> {t("homeGroup")} </NavLink>
        <NavLink to={`/groups/${groupId}/members`} className={cls}> {t("membersGroup")} </NavLink>
        <NavLink to={`/groups/${groupId}/media`} className={cls}> {t("mediaGroup")} </NavLink>
        <NavLink to={`/groups/${groupId}/events`} className={cls}> {t("eventsGroup")} </NavLink>
        <NavLink to={`/groups/${groupId}/about`} className={cls}> {t("aboutGroup")}</NavLink>
      </nav>
    </div>
  );
}
