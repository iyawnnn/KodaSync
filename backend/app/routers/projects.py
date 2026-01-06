from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from ..database import get_session
from ..models import Project, User
from ..routers.notes import get_current_user
from ..limiter import limiter
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

# 🚀 NEW: Schema for updates
class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_pinned: bool | None = None

@router.post("/", response_model=Project)
@limiter.limit("10/minute")
async def create_project(
    request: Request,
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )
    session.add(new_project)
    session.commit()
    session.refresh(new_project)
    return new_project

@router.get("/", response_model=list[Project])
@limiter.limit("50/minute")
async def get_projects(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Sort by Pinned first
    statement = select(Project).where(Project.owner_id == current_user.id).order_by(
        Project.is_pinned.desc(),
        Project.created_at.desc()
    )
    return session.exec(statement).all()

# 🚀 NEW: Patch endpoint for Rename/Pin
@router.patch("/{project_id}", response_model=Project)
@limiter.limit("20/minute")
async def update_project(
    request: Request,
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: p_uuid = uuid.UUID(project_id)
    except: raise HTTPException(status_code=400)

    project = session.get(Project, p_uuid)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.is_pinned is not None:
        project.is_pinned = project_data.is_pinned
        
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.delete("/{project_id}")
@limiter.limit("10/minute")
async def delete_project(
    request: Request,
    project_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: p_uuid = uuid.UUID(project_id)
    except: raise HTTPException(status_code=400)
    
    project = session.get(Project, p_uuid)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    session.delete(project)
    session.commit()
    return {"message": "Deleted"}