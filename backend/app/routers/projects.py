from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from ..database import get_session
from ..models import Project, User
from ..routers.notes import get_current_user
from ..limiter import limiter # <--- Import Limiter
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

@router.post("/", response_model=Project)
@limiter.limit("10/minute") # Strict limit on creation
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
@limiter.limit("50/minute") # Loose limit on reading
async def get_projects(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(Project).where(Project.owner_id == current_user.id).order_by(Project.created_at.desc())
    return session.exec(statement).all()

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