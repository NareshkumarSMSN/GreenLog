package com.greenlog.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "trees")
public class Tree {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tree species is required")
    private String species;

    @NotNull(message = "Tree planting date is required")
    private LocalDate datePlanted;

    private LocalDate nextCheckInDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ALIVE;

    @ManyToOne
    @JoinColumn(name = "drive_id", nullable = false)
    private PlantationDrive drive;

    @ManyToOne
    @JoinColumn(name = "volunteer_id", nullable = false)
    private Volunteer plantedBy;

    public enum Status { ALIVE, DEAD }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }
    public LocalDate getDatePlanted() { return datePlanted; }
    public void setDatePlanted(LocalDate datePlanted) { this.datePlanted = datePlanted; }
    public LocalDate getNextCheckInDate() { return nextCheckInDate; }
    public void setNextCheckInDate(LocalDate nextCheckInDate) { this.nextCheckInDate = nextCheckInDate; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public PlantationDrive getDrive() { return drive; }
    public void setDrive(PlantationDrive drive) { this.drive = drive; }
    public Volunteer getPlantedBy() { return plantedBy; }
    public void setPlantedBy(Volunteer plantedBy) { this.plantedBy = plantedBy; }
}
